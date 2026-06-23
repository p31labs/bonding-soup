// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TrancheWaterfall — Three-Tier Distribution
/// @notice Strict sequential waterfall for corporate profit distribution:
///         Tranche 1: OpEx + payroll (intellectual energy)
///         Tranche 2: Asset sweep to Perpetual Purpose Trust (capital preservation)
///         Tranche 3: PoC dividend distribution (ontological energy)
/// @dev Operates on Base L2. Integrates with PayrollStream, SlicingPieLedger,
///      LOVEToken, and PPT (via GME Computershare bridge).
import "./ISharedERC20.sol";

contract TrancheWaterfall {
    // ── Types ────────────────────────────────────────────────────────
    struct TrancheConfig {
        bool initialized;
        address payrollStream;        // PayrollStream contract
        address slicingPieLedger;     // SlicingPieLedger contract
        address loveToken;            // LOVEToken contract
        address pptVault;             // Perpetual Purpose Trust vault
        address gmeBridge;            // GME Computershare bridge
        address usdc;                 // USDC token
        uint256 operatingReserve;     // % of revenue held as operating reserve (1e18 = 100%)
        uint256 sweepThreshold;       // Minimum USDC to trigger sweep
    }

    TrancheConfig public config;
    address public architect;

    uint256 public totalDistributed;
    uint256 public tranche1Distributed;
    uint256 public tranche2Distributed;
    uint256 public tranche3Distributed;

    // ── Events ───────────────────────────────────────────────────────
    event WaterfallExecuted(uint256 revenue, uint256 tranche1, uint256 tranche2, uint256 tranche3);
    event Tranche1Paid(uint256 amount);
    event Tranche2Swept(uint256 amount);
    event Tranche3Distributed(uint256 amount);
    event ConfigUpdated(address indexed key);

    // ── Errors ───────────────────────────────────────────────────────
    error Unauthorized();
    error NotConfigured();
    error ZeroValue();
    error TransferFailed();

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyArchitect() { if (msg.sender != architect) revert Unauthorized(); _; }
    modifier whenConfigured() { if (!config.initialized) revert NotConfigured(); _; }

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _architect) {
        if (_architect == address(0)) revert("Zero addr");
        architect = _architect;
    }

    // ── Configuration ────────────────────────────────────────────────
    function configure(
        address _payrollStream,
        address _slicingPieLedger,
        address _loveToken,
        address _pptVault,
        address _gmeBridge,
        address _usdc,
        uint256 _operatingReserve,
        uint256 _sweepThreshold
    ) external onlyArchitect {
        if (_payrollStream == address(0) || _pptVault == address(0) || _usdc == address(0))
            revert("Zero addr");

        config = TrancheConfig({
            initialized: true,
            payrollStream: _payrollStream,
            slicingPieLedger: _slicingPieLedger,
            loveToken: _loveToken,
            pptVault: _pptVault,
            gmeBridge: _gmeBridge,
            usdc: _usdc,
            operatingReserve: _operatingReserve,
            sweepThreshold: _sweepThreshold
        });

        emit ConfigUpdated(_payrollStream);
    }

    // ── Waterfall Execution ─────────────────────────────────────────
    /// @notice Execute the full distribution waterfall on available balance.
    function executeWaterfall() external whenConfigured {
        uint256 balance = ISharedERC20(config.usdc).balanceOf(address(this));
        if (balance == 0) revert ZeroValue();

        uint256 remaining = balance;
        uint256 t1 = 0;
        uint256 t2 = 0;
        uint256 t3 = 0;

        // Tranche 1: Operating reserve
        uint256 reserve = (balance * config.operatingReserve) / 1e18;
        if (reserve > 0) {
            t1 = reserve;
            remaining -= reserve;
            _distributeTranche1(reserve);
        }

        // Tranche 2: Sweep to PPT vault (if above threshold)
        if (remaining >= config.sweepThreshold) {
            t2 = remaining;
            remaining = 0;
            _distributeTranche2(t2);
        }

        // Tranche 3: Remaining → PoC dividend pool
        if (remaining > 0) {
            t3 = remaining;
            remaining = 0;
            _distributeTranche3(t3);
        }

        totalDistributed += balance;
        tranche1Distributed += t1;
        tranche2Distributed += t2;
        tranche3Distributed += t3;

        emit WaterfallExecuted(balance, t1, t2, t3);
    }

    // ── Tranche 1: Operational Payroll + Buyback ─────────────────────
    function _distributeTranche1(uint256 amount) internal {
        // Transfer to PayrollStream for salary streaming + SlicingPie buyback
        if (config.payrollStream != address(0)) {
            if (ISharedERC20(config.usdc).transfer(config.payrollStream, amount) == false)
                revert TransferFailed();
        }
        emit Tranche1Paid(amount);
    }

    // ── Tranche 2: PPT Asset Sweep ───────────────────────────────────
    function _distributeTranche2(uint256 amount) internal {
        if (config.pptVault != address(0)) {
            if (ISharedERC20(config.usdc).transfer(config.pptVault, amount) == false)
                revert TransferFailed();
        }
        emit Tranche2Swept(amount);
    }

    // ── Tranche 3: PoC Dividend Distribution ─────────────────────────
    function _distributeTranche3(uint256 amount) internal {
        if (config.loveToken != address(0)) {
            // Transfer to LOVEToken contract for performance pool distribution
            if (ISharedERC20(config.usdc).transfer(config.loveToken, amount) == false)
                revert TransferFailed();
        }
        emit Tranche3Distributed(amount);
    }

    // ── Admin ────────────────────────────────────────────────────────
    /// @notice Deposit USDC into the waterfall for distribution.
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroValue();
        if (ISharedERC20(config.usdc).transferFrom(msg.sender, address(this), amount) == false)
            revert TransferFailed();
    }

    function updateConfig(bytes32 key, address value) external onlyArchitect {
        if (key == "payrollStream") config.payrollStream = value;
        else if (key == "slicingPieLedger") config.slicingPieLedger = value;
        else if (key == "loveToken") config.loveToken = value;
        else if (key == "pptVault") config.pptVault = value;
        else if (key == "gmeBridge") config.gmeBridge = value;
        else if (key == "usdc") config.usdc = value;
        else revert("Unknown key");
        emit ConfigUpdated(value);
    }

    function setOperatingReserve(uint256 reserve) external onlyArchitect {
        if (reserve > 1e18) revert("Max 100%");
        config.operatingReserve = reserve;
    }

    function setSweepThreshold(uint256 threshold) external onlyArchitect {
        config.sweepThreshold = threshold;
    }

    function transferArchitect(address next) external onlyArchitect {
        if (next == address(0)) revert("Zero addr");
        architect = next;
    }
}
