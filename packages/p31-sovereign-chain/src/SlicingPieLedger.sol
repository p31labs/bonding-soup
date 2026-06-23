// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Slicing Pie Ledger — Deferred Compensation Tracker
/// @notice Quantifies unpaid operational labor as "Slices" with risk multipliers.
///         GHRR = ((Negotiated Base Annual Salary - Actual Cash Compensation) * 2) / 2000
///         2x multiplier for deferred time, 4x for cash contributions.
///         Segregated from L.O.V.E. tokens — strictly operational debt.
contract SlicingPieLedger {
    // ── Types ────────────────────────────────────────────────────────
    /// @notice A single contribution entry.
    struct Contribution {
        address contributor;
        uint256 hourlyRate;       // GHRR in USD (scaled 1e18)
        uint256 hoursWorked;      // Unpaid hours logged
        uint256 cashContributed;  // Out-of-pocket expenses in USD (scaled 1e18)
        uint256 totalSlices;      // Computed: (hours * rate * 2) + (cash * 4)
        uint256 slicesBoughtBack; // Slices repaid via Tranche 1
        uint256 buybackValueUsd;  // USD value of bought-back slices
        uint256 timestamp;
        bytes32 ref;              // Reference (e.g. work log CID)
    }

    struct ContributorState {
        uint256 totalSlices;
        uint256 slicesBoughtBack;
        uint256 contributionCount;
        uint256 totalHoursWorked;
        uint256 totalCashContributed;
    }

    // ── State ────────────────────────────────────────────────────────
    address public architect;
    address public payrollStream;      // PayrollStream contract for buyback
    uint256 public contributionCount;
    mapping(uint256 => Contribution) public contributions;
    mapping(address => ContributorState) public contributors;
    mapping(address => uint256[]) public contributorContributions;

    uint256 public constant TIME_MULTIPLIER = 2;  // 2x for deferred salary
    uint256 public constant CASH_MULTIPLIER = 4;  // 4x for cash outlay
    uint256 public constant STANDARD_HOURS = 2000; // Annual working hours

    // ── Events ───────────────────────────────────────────────────────
    event ContributionLogged(uint256 indexed id, address indexed contributor, uint256 hoursWorked,
                             uint256 cashContributed, uint256 slices, bytes32 ref);
    event BuybackExecuted(address indexed contributor, uint256 slicesBoughtBack, uint256 usdPaid);

    // ── Errors ───────────────────────────────────────────────────────
    error Unauthorized();
    error ZeroAddress();
    error NoSlices();
    error InsufficientSlices();

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyArchitect() { if (msg.sender != architect) revert Unauthorized(); _; }

    // ── Constructor ──────────────────────────────────────────────────
    constructor(address _architect) {
        if (_architect == address(0)) revert ZeroAddress();
        architect = _architect;
    }

    // ── Contribution Logging ─────────────────────────────────────────
    /// @notice Log an operational contribution.
    /// @param contributor The person who contributed.
    /// @param annualSalary Negotiated base annual salary (USD, scaled 1e18).
    /// @param cashPaid Actual cash compensation received (USD, scaled 1e18).
    /// @param hoursWorked Unpaid hours worked.
    /// @param cashContributed Out-of-pocket expenses (USD, scaled 1e18).
    /// @param ref Reference hash (e.g. work log CID).
    function logContribution(
        address contributor,
        uint256 annualSalary,
        uint256 cashPaid,
        uint256 hoursWorked,
        uint256 cashContributed,
        bytes32 ref
    ) external onlyArchitect {
        if (contributor == address(0)) revert ZeroAddress();
        if (hoursWorked == 0 && cashContributed == 0) revert("No input");

        // GHRR = ((Base Salary - Cash Comp) * 2) / 2000
        uint256 unpaidSalary = (annualSalary > cashPaid) ? annualSalary - cashPaid : 0;
        uint256 ghrr = (unpaidSalary * 2) / (STANDARD_HOURS * 1e18) * 1e18; // Scaled

        // Slices = (hours * GHRR * 2x) + (cash * 4x)
        uint256 timeSlices = hoursWorked > 0 ? (hoursWorked * ghrr * TIME_MULTIPLIER) / 1e18 : 0;
        uint256 cashSlices = cashContributed > 0 ? (cashContributed * CASH_MULTIPLIER) / 1e18 : 0;
        uint256 totalSlices = timeSlices + cashSlices;

        contributionCount++;
        contributions[contributionCount] = Contribution({
            contributor: contributor,
            hourlyRate: ghrr,
            hoursWorked: hoursWorked,
            cashContributed: cashContributed,
            totalSlices: totalSlices,
            slicesBoughtBack: 0,
            buybackValueUsd: 0,
            timestamp: block.timestamp,
            ref: ref
        });

        contributorContributions[contributor].push(contributionCount);
        ContributorState storage cs = contributors[contributor];
        cs.totalSlices += totalSlices;
        cs.contributionCount++;
        cs.totalHoursWorked += hoursWorked;
        cs.totalCashContributed += cashContributed;

        emit ContributionLogged(contributionCount, contributor, hoursWorked, cashContributed, totalSlices, ref);
    }

    // ── Buyback ──────────────────────────────────────────────────────
    /// @notice Buy back slices (repay deferred compensation from Tranche 1).
    /// @param contributor The contributor to repay.
    /// @param usdAmount USD value to pay (scaled 1e18).
    /// @dev Called by TrancheWaterfall or architect when funds are available.
    function buybackSlices(address contributor, uint256 usdAmount) external {
        if (msg.sender != architect && msg.sender != payrollStream) revert Unauthorized();
        ContributorState storage cs = contributors[contributor];
        uint256 outstanding = cs.totalSlices - cs.slicesBoughtBack;
        if (outstanding == 0) revert NoSlices();

        // Determine value per slice based on blended GHRR
        uint256 totalUsdOwed = (outstanding * 1e18) / 2; // Approximate: slices ~ 0.5 USD average
        uint256 slicesCleared = (usdAmount * outstanding) / totalUsdOwed;
        if (slicesCleared > outstanding) slicesCleared = outstanding;
        if (slicesCleared == 0) revert InsufficientSlices();

        cs.slicesBoughtBack += slicesCleared;

        emit BuybackExecuted(contributor, slicesCleared, usdAmount);
    }

    // ── Queries ──────────────────────────────────────────────────────
    /// @notice Get outstanding (unbought) slices for a contributor.
    function outstandingSlices(address contributor) external view returns (uint256) {
        ContributorState storage cs = contributors[contributor];
        return cs.totalSlices - cs.slicesBoughtBack;
    }

    function getContributor(address contributor) external view returns (ContributorState memory) {
        return contributors[contributor];
    }

    function getContributions(address contributor) external view returns (uint256[] memory) {
        return contributorContributions[contributor];
    }

    function getContribution(uint256 id) external view returns (Contribution memory) {
        return contributions[id];
    }

    // ── Admin ────────────────────────────────────────────────────────
    function setPayrollStream(address _payroll) external onlyArchitect {
        if (_payroll == address(0)) revert ZeroAddress();
        payrollStream = _payroll;
    }

    function transferArchitect(address next) external onlyArchitect {
        if (next == address(0)) revert ZeroAddress();
        architect = next;
    }
}
