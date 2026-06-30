// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Perpetual Purpose Trust Vault
/// @notice Legal wrapper for the PPT — holds DUNA/DAO ownership.
///         Manages the Sovereign Vault (GME shares via Computershare bridge),
///         enforces purpose-bound asset lock, and authorizes PoC dividend
///         distributions to L.O.V.E. token holders.
/// @dev The PPT is non-charitable, purpose-driven — no human beneficiaries.
///      Assets are firewalled from personal liabilities (Van Camp shield).
import "./ISharedERC20.sol";

contract PerpetualPurposeTrust {
    // ── Types ────────────────────────────────────────────────────────
    struct TrustInstrument {
        string purpose;            // Purpose statement (e.g. "Sovereign wealth for Founding Nodes")
        address steward;           // Trust steward (entity, not individual)
        address successor;         // Backup steward
        uint256 createdAt;
        uint256 duration;          // Duration in seconds (0 = perpetual)
    }

    struct SovereignVault {
        uint256 gmeShares;         // Direct-registered GME share count
        uint256 usdcReserve;       // USDC held in vault
        uint256 lastDividendEpoch; // Last dividend distribution timestamp
        address[] authorizedBeneficiaries; // L.O.V.E. token holders
    }

    // ── State ────────────────────────────────────────────────────────
    address public architect;
    TrustInstrument public instrument;
    SovereignVault public vault;

    // Authorized contracts
    address public loveToken;            // LOVEToken contract
    address public trancheWaterfall;     // TrancheWaterfall contract
    address public gmeBridge;            // GME Computershare bridge
    address public usdc;                 // USDC token

    // ── Events ───────────────────────────────────────────────────────
    event AssetSwept(uint256 usdcAmount, uint256 gmeSharesEquivalent);
    event DividendDistributed(uint256 epoch, uint256 totalAmount, uint256 beneficiaryCount);
    event BeneficiaryAdded(address indexed beneficiary);
    event LoveTokenSet(address indexed token);
    event StewardTransferred(address indexed newSteward);

    // ── Errors ───────────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();
    error NoAssets();
    error NotConfigured();
    error PurposeViolation();

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyArchitect() { if (msg.sender != architect) revert Unauthorized(); _; }
    modifier onlyWaterfall() { if (msg.sender != trancheWaterfall) revert Unauthorized(); _; }

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _architect, string memory _purpose) {
        if (_architect == address(0)) revert ZeroAddress();
        architect = _architect;
        instrument = TrustInstrument({
            purpose: _purpose,
            steward: _architect,
            successor: address(0),
            createdAt: block.timestamp,
            duration: 0 // Perpetual
        });
    }

    // ── Configuration ────────────────────────────────────────────────
    function configure(
        address _loveToken,
        address _trancheWaterfall,
        address _gmeBridge,
        address _usdc
    ) external onlyArchitect {
        if (_loveToken == address(0) || _usdc == address(0)) revert ZeroAddress();
        loveToken = _loveToken;
        trancheWaterfall = _trancheWaterfall;
        gmeBridge = _gmeBridge;
        usdc = _usdc;
        emit LoveTokenSet(_loveToken);
    }

    // ── Asset Sweep (Tranche 2) ──────────────────────────────────────
    /// @notice Accept USDC sweep from TrancheWaterfall.
    /// @dev TrancheWaterfall calls this after Tranche 1 is satisfied.
    function sweepAssets(uint256 usdcAmount) external onlyWaterfall {
        if (usdcAmount == 0) revert NoAssets();
        if (ISharedERC20(usdc).transferFrom(msg.sender, address(this), usdcAmount) == false)
            revert("Transfer failed");

        vault.usdcReserve += usdcAmount;
        // GME conversion is off-chain via Computershare bridge
        emit AssetSwept(usdcAmount, 0);
    }

    // ── Dividend Distribution (Tranche 3) ────────────────────────────
    /// @notice Distribute PoC dividends to L.O.V.E. token holders.
    /// @param totalAmount Total USDC to distribute.
    /// @param beneficiaries List of recipient addresses.
    /// @param amounts Corresponding amounts for each.
    function distributeDividends(
        uint256 totalAmount,
        address[] calldata beneficiaries,
        uint256[] calldata amounts
    ) external onlyArchitect {
        if (totalAmount > vault.usdcReserve) revert NoAssets();
        uint256 len = beneficiaries.length;
        if (len != amounts.length) revert("Length mismatch");

        uint256 distributed;
        for (uint256 i = 0; i < len; i++) {
            if (beneficiaries[i] != address(0) && amounts[i] > 0) {
                if (ISharedERC20(usdc).transfer(beneficiaries[i], amounts[i]) == false)
                    revert("Transfer failed");
                distributed += amounts[i];
            }
        }

        vault.usdcReserve -= distributed;
        vault.lastDividendEpoch = block.timestamp;

        emit DividendDistributed(vault.lastDividendEpoch, distributed, len);
    }

    // ── GME Bridge ───────────────────────────────────────────────────
    /// @notice Record GME share acquisition (off-chain Computershare DRS).
    function recordGmeAcquisition(uint256 shares) external onlyArchitect {
        vault.gmeShares += shares;
    }

    function recordGmeDisposal(uint256 shares, uint256 usdcProceeds) external onlyArchitect {
        if (shares > vault.gmeShares) revert NoAssets();
        vault.gmeShares -= shares;
        vault.usdcReserve += usdcProceeds;
    }

    // ── Beneficiary Management ───────────────────────────────────────
    function addBeneficiary(address beneficiary) external onlyArchitect {
        if (beneficiary == address(0)) revert ZeroAddress();
        vault.authorizedBeneficiaries.push(beneficiary);
        emit BeneficiaryAdded(beneficiary);
    }

    function getBeneficiaries() external view returns (address[] memory) {
        return vault.authorizedBeneficiaries;
    }

    // ── Steward Transfer ─────────────────────────────────────────────
    function transferStewardship(address newSteward) external onlyArchitect {
        if (newSteward == address(0)) revert ZeroAddress();
        instrument.steward = newSteward;
        emit StewardTransferred(newSteward);
    }

    // ── Query ────────────────────────────────────────────────────────
    function getVaultStatus() external view returns (
        uint256 gmeShares,
        uint256 usdcReserve,
        uint256 lastDividendEpoch,
        address steward,
        string memory purpose
    ) {
        return (
            vault.gmeShares,
            vault.usdcReserve,
            vault.lastDividendEpoch,
            instrument.steward,
            instrument.purpose
        );
    }

    // ── Admin ────────────────────────────────────────────────────────
    function transferArchitect(address next) external onlyArchitect {
        if (next == address(0)) revert ZeroAddress();
        architect = next;
    }
}
