// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LOVEToken.sol";
import "../src/ProofOfCare.sol";
import "../src/LOVESBT.sol";
import "../src/PayrollStream.sol";
import "../src/SlicingPieLedger.sol";
import "../src/TrancheWaterfall.sol";
import "../src/PerpetualPurposeTrust.sol";

contract LOVEIntegrationTest is Test {
    LOVEToken love;
    ProofOfCare poc;
    LOVESBT loveSBT;
    PayrollStream payroll;
    SlicingPieLedger pie;
    TrancheWaterfall waterfall;
    PerpetualPurposeTrust ppt;

    address architect = address(0x1234);
    address user1 = address(0x1001);
    address user2 = address(0x1002);

    function setUp() public {
        love = new LOVEToken(architect);
        poc = new ProofOfCare(architect, address(love), address(0));
        loveSBT = new LOVESBT(architect, address(poc));

        vm.prank(architect);
        poc.setLoveSBT(address(loveSBT));

        payroll = new PayrollStream(architect);
        pie = new SlicingPieLedger(architect);
        waterfall = new TrancheWaterfall(architect);
        ppt = new PerpetualPurposeTrust(architect, "Test PPT");

        // Wire (careOracle stays architect for testing)
        vm.prank(architect);
        love.setPoolManager(address(waterfall));
        vm.prank(architect);
        love.setCareOracle(address(poc));
        vm.prank(architect);
        poc.setLoveToken(address(love));
        vm.prank(architect);
        poc.setLoveSBT(address(loveSBT));
        vm.prank(architect);
        pie.setPayrollStream(address(payroll));
    }

    // ── LOVEToken Tests ───────────────────────────────────────────────
    function testMintAndSplit() public {
        vm.prank(architect);
        love.setPoolManager(architect);

        vm.prank(architect);
        love.mint(user1, 100 ether);

        (uint256 total, uint256 sov, uint256 perf,,,) = love.getPoolBalance(user1);
        assertEq(total, 100 ether);
        assertEq(sov, 50 ether);
        assertEq(perf, 50 ether);
    }

    function testSoulbound() public {
        vm.prank(architect);
        vm.expectRevert(LOVEToken.Soulbound.selector);
        love.transfer(user2, 1 ether);
    }

    function testCareScoreUpdate() public {
        vm.prank(architect);
        love.setPoolManager(architect);
        vm.prank(architect);
        love.mint(user1, 100 ether);

        vm.prank(address(poc));
        love.updateCareScore(user1, 0.8e18);

        (,,,, uint256 avail,) = love.getPoolBalance(user1);
        assertEq(avail, 40 ether);
    }

    function testBurn() public {
        vm.prank(architect);
        love.setPoolManager(architect);
        vm.prank(architect);
        love.mint(user1, 100 ether);

        vm.prank(architect);
        love.burn(user1, 20 ether);

        (uint256 total,,,,,) = love.getPoolBalance(user1);
        assertEq(total, 80 ether);
    }

    function testAbdication() public {
        vm.prank(architect);
        love.abdicate();
        assertEq(love.architect(), 0x000000000000000000000000000000000000dEaD);
    }

    // ── ProofOfCare Tests ─────────────────────────────────────────────
    function testSubmitCareProof() public {
        vm.prank(architect);
        poc.setRelay(architect);

        address[] memory users = new address[](1);
        users[0] = user1;
        uint256[] memory tProx = new uint256[](1);
        tProx[0] = 120 ether;
        uint256[] memory qRes = new uint256[](1);
        qRes[0] = 0.8e18;
        uint256[] memory tasks = new uint256[](1);
        tasks[0] = 5;
        bytes32[] memory roots = new bytes32[](1);
        roots[0] = keccak256("telemetry-001");

        vm.prank(architect);
        poc.submitCareProofs(users, tProx, qRes, tasks, roots);

        uint256 score = poc.computeEffectiveScore(user1);
        assertTrue(score > 0);
    }

    function testCareScoreDecay() public {
        vm.prank(architect);
        poc.setRelay(architect);

        address[] memory users = new address[](1);
        users[0] = user1;
        uint256[] memory tProx = new uint256[](1);
        tProx[0] = 1000 ether;
        uint256[] memory qRes = new uint256[](1);
        qRes[0] = 1e18;
        uint256[] memory tasks = new uint256[](1);
        tasks[0] = 10;
        bytes32[] memory roots = new bytes32[](1);
        roots[0] = keccak256("decay-test");

        vm.prank(architect);
        poc.submitCareProofs(users, tProx, qRes, tasks, roots);

        uint256 initial = poc.computeEffectiveScore(user1);

        // Warp past grace period
        vm.warp(block.timestamp + 14 days);

        uint256 decayed = poc.computeEffectiveScore(user1);
        assertTrue(decayed < initial, "Score should decay");
    }

    // ── ProofOfCare + SBT Integration Tests ─────────────────────────────
    function testSBTMintedOnThresholdCross() public {
        vm.prank(architect);
        poc.setRelay(architect);

        address[] memory users = new address[](1);
        users[0] = user1;
        uint256[] memory tProx = new uint256[](1);
        tProx[0] = 500 ether;
        uint256[] memory qRes = new uint256[](1);
        qRes[0] = 1e18;
        uint256[] memory tasks = new uint256[](1);
        tasks[0] = 50;
        bytes32[] memory roots = new bytes32[](1);
        roots[0] = keccak256("sbt-threshold-test");

        vm.prank(architect);
        poc.submitCareProofs(users, tProx, qRes, tasks, roots);

        uint256 score = poc.computeEffectiveScore(user1);
        assertTrue(score >= poc.CARE_THRESHOLD(), "Score should cross threshold");

        uint256[] memory sbtIds = loveSBT.getSBTs(user1);
        assertGt(sbtIds.length, 0, "User should have at least one SBT");

        (uint256 sbtScore,,,) = loveSBT.reputationData(sbtIds[0]);
        assertEq(sbtScore, score);
    }

    function testLOVERewardMintedOnThreshold() public {
        vm.prank(architect);
        poc.setRelay(architect);

        address[] memory users = new address[](1);
        users[0] = user1;
        uint256[] memory tProx = new uint256[](1);
        tProx[0] = 500 ether;
        uint256[] memory qRes = new uint256[](1);
        qRes[0] = 1e18;
        uint256[] memory tasks = new uint256[](1);
        tasks[0] = 50;
        bytes32[] memory roots = new bytes32[](1);
        roots[0] = keccak256("reward-threshold-test");

        vm.warp(block.timestamp + poc.REWARD_COOLDOWN() + 1);

        vm.prank(architect);
        poc.submitCareProofs(users, tProx, qRes, tasks, roots);

        assertEq(love.balanceOf(user1), poc.REWARD_AMOUNT());
    }

    // ── PayrollStream Tests ───────────────────────────────────────────
    function testCreateAndWithdraw() public {
        // Deploy mock USDC
        MockERC20 usdc = new MockERC20("USDC", "USDC", 6);
        usdc.mint(architect, 1000e6);
        vm.prank(architect);
        usdc.approve(address(payroll), 1000e6);

        vm.prank(architect);
        uint256 streamId = payroll.createStream(
            user1, address(usdc), 1000e6,
            block.timestamp, block.timestamp + 30 days,
            0, keccak256("employment-agreement")
        );
        assertEq(streamId, 1);

        vm.warp(block.timestamp + 15 days);

        uint256 withdrawable = payroll.withdrawableAmount(streamId);
        assertTrue(withdrawable > 0);
        assertTrue(withdrawable < 1000e6);
    }

    // ── SlicingPieLedger Tests ────────────────────────────────────────
    function testLogContribution() public {
        vm.prank(architect);
        pie.logContribution(
            user1,
            80_000e18, // $80k salary
            0,          // $0 paid
            100,        // 100 hours
            500e18,     // $500 cash contributed
            keccak256("work-log-001")
        );

        uint256 outstanding = pie.outstandingSlices(user1);
        assertTrue(outstanding > 0);
    }

    // ── TrancheWaterfall Tests ────────────────────────────────────────
    function testConfigureWaterfall() public {
        vm.prank(architect);
        waterfall.configure(
            address(payroll), address(pie), address(love),
            address(ppt), address(0), address(0xBEEF),
            0.2e18, 1000e6
        );

        (bool initialized,,,,,,,,) = waterfall.config();
        assertTrue(initialized);
    }

    // ── PerpetualPurposeTrust Tests ───────────────────────────────────
    function testPurposeAndSteward() public {
        (,,, address steward, string memory purpose) = ppt.getVaultStatus();
        assertEq(steward, architect);
        assertEq(purpose, "Test PPT");
    }

    function testAddBeneficiary() public {
        vm.prank(architect);
        ppt.addBeneficiary(user1);
        address[] memory beneficiaries = ppt.getBeneficiaries();
        assertEq(beneficiaries.length, 1);
        assertEq(beneficiaries[0], user1);
    }
}

// ── Mock ERC20 for testing ────────────────────────────────────────────
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "no allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
