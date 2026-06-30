// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PayrollStream — Sablier-style Closed-Ended Streaming
/// @notice USDC payroll streams with fixed deposit, exact duration,
///         cancellable by DAO. Mirrors a fixed-term employment contract
///         for Van Camp / IRS Section 4958 compliance.
/// @dev Operates on Base L2 (identical layer as L.O.V.E. tokens).
///      Integrates with P31TreasuryConfig for Safe + USDC pointers.
import "./ISharedERC20.sol";

contract PayrollStream {
    // ── Types ────────────────────────────────────────────────────────
    enum StreamStatus { PENDING, ACTIVE, CANCELLED, COMPLETED }

    struct Stream {
        address sender;       // DAO treasury / DUNA
        address recipient;    // Employee / contractor
        address token;        // USDC address
        uint256 deposit;      // Total USDC deposited
        uint256 startTime;
        uint256 stopTime;
        uint256 withdrawn;    // USDC withdrawn so far
        uint256 cliff;        // Vesting cliff (optional, 0 = none)
        bytes32 ref;          // Reference hash (e.g. employment agreement CID)
        StreamStatus status;
    }

    // ── State ────────────────────────────────────────────────────────
    address public architect;
    uint256 public streamCount;
    mapping(uint256 => Stream) public streams;
    mapping(address => uint256[]) public recipientStreams;

    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 365 days;

    // ── Events ───────────────────────────────────────────────────────
    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient,
                        uint256 deposit, uint256 startTime, uint256 stopTime, bytes32 ref);
    event StreamCancelled(uint256 indexed streamId);
    event StreamWithdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();
    error InvalidDuration();
    error NoStream();
    error StreamNotActive();
    error AlreadyWithdrawn();
    error InsufficientBalance();
    error StreamExpired();

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyArchitect() { if (msg.sender != architect) revert Unauthorized(); _; }

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _architect) {
        if (_architect == address(0)) revert ZeroAddress();
        architect = _architect;
    }

    // ── Stream Lifecycle ─────────────────────────────────────────────
    /// @notice Create a closed-ended payroll stream.
    /// @param recipient Employee wallet address.
    /// @param token USDC token address.
    /// @param deposit Total USDC to stream (in USDC decimals, usually 6).
    /// @param startTime Unix timestamp when streaming begins.
    /// @param stopTime Unix timestamp when streaming ends.
    /// @param cliff Vesting cliff in seconds (0 = none).
    /// @param ref Reference hash (e.g. keccak256 of employment agreement).
    /// @dev Sender must have approved this contract to spend `deposit` USDC.
    function createStream(
        address recipient,
        address token,
        uint256 deposit,
        uint256 startTime,
        uint256 stopTime,
        uint256 cliff,
        bytes32 ref
    ) external returns (uint256 streamId) {
        if (recipient == address(0) || token == address(0)) revert ZeroAddress();
        if (stopTime <= startTime || stopTime - startTime < MIN_DURATION || stopTime - startTime > MAX_DURATION)
            revert InvalidDuration();
        if (deposit == 0) revert InvalidDuration();
        if (cliff > stopTime - startTime) revert InvalidDuration();

        streamId = ++streamCount;
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            token: token,
            deposit: deposit,
            startTime: startTime,
            stopTime: stopTime,
            withdrawn: 0,
            cliff: cliff,
            ref: ref,
            status: StreamStatus.ACTIVE
        });

        recipientStreams[recipient].push(streamId);

        // Transfer USDC from sender to this contract
        ISharedERC20(token).transferFrom(msg.sender, address(this), deposit);

        emit StreamCreated(streamId, msg.sender, recipient, deposit, startTime, stopTime, ref);
    }

    // ── Streaming Withdrawals ────────────────────────────────────────
    /// @notice Withdraw vested USDC from a stream.
    /// @param streamId The stream to withdraw from.
    function withdraw(uint256 streamId) external {
        Stream storage s = streams[streamId];
        if (s.status != StreamStatus.ACTIVE) revert StreamNotActive();
        if (block.timestamp < s.cliff + s.startTime) revert StreamNotActive();

        uint256 vested = _vestedAmount(s);
        uint256 withdrawable = vested - s.withdrawn;

        if (withdrawable == 0) revert AlreadyWithdrawn();

        s.withdrawn += withdrawable;

        if (block.timestamp >= s.stopTime) {
            s.status = StreamStatus.COMPLETED;
        }

        if (ISharedERC20(s.token).transfer(s.recipient, withdrawable) == false) revert InsufficientBalance();
        emit StreamWithdrawn(streamId, s.recipient, withdrawable);
    }

    /// @notice Calculate vested amount at current timestamp.
    function _vestedAmount(Stream storage s) internal view returns (uint256) {
        if (block.timestamp <= s.startTime + s.cliff) return 0;
        if (block.timestamp >= s.stopTime) return s.deposit;

        uint256 elapsed = block.timestamp - s.startTime;
        uint256 duration = s.stopTime - s.startTime;
        return (s.deposit * elapsed) / duration;
    }

    // ── Cancellation ─────────────────────────────────────────────────
    /// @notice Cancel an active stream. Unstreamed tokens return to sender.
    /// @param streamId The stream to cancel.
    function cancelStream(uint256 streamId) external {
        Stream storage s = streams[streamId];
        if (s.status != StreamStatus.ACTIVE) revert StreamNotActive();
        if (msg.sender != s.sender && msg.sender != architect) revert Unauthorized();

        s.status = StreamStatus.CANCELLED;

        uint256 vested = _vestedAmount(s);
        uint256 unstreamed = s.deposit - s.withdrawn;

        // Allow recipient to withdraw vested portion
        if (vested > s.withdrawn) {
            uint256 owed = vested - s.withdrawn;
            s.withdrawn += owed;
            if (ISharedERC20(s.token).transfer(s.recipient, owed) == false) revert InsufficientBalance();
            emit StreamWithdrawn(streamId, s.recipient, owed);
            unstreamed = unstreamed - owed;
        }

        // Return remaining to sender
        if (unstreamed > 0) {
            if (ISharedERC20(s.token).transfer(s.sender, unstreamed) == false) revert InsufficientBalance();
        }

        emit StreamCancelled(streamId);
    }

    // ── Queries ──────────────────────────────────────────────────────
    /// @notice Get the currently withdrawable amount for a stream.
    function withdrawableAmount(uint256 streamId) external view returns (uint256) {
        Stream storage s = streams[streamId];
        if (s.status != StreamStatus.ACTIVE) return 0;
        uint256 vested = _vestedAmount(s);
        if (vested <= s.withdrawn) return 0;
        return vested - s.withdrawn;
    }

    function getRecipientStreams(address recipient) external view returns (uint256[] memory) {
        return recipientStreams[recipient];
    }

    // ── Admin ────────────────────────────────────────────────────────
    function transferArchitect(address next) external onlyArchitect {
        if (next == address(0)) revert ZeroAddress();
        architect = next;
    }
}
