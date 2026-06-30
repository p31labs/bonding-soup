// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/LOVEToken.sol";
import "../src/ProofOfCare.sol";
import "../src/PayrollStream.sol";
import "../src/SlicingPieLedger.sol";
import "../src/TrancheWaterfall.sol";
import "../src/PerpetualPurposeTrust.sol";

/// @notice Deploy all 6 contracts and wire them together.
contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy L.O.V.E. Token
        LOVEToken love = new LOVEToken(deployer);
        console.log("LOVEToken deployed at:", address(love));

        // 2. Deploy Proof of Care Oracle
        ProofOfCare poc = new ProofOfCare(deployer);
        console.log("ProofOfCare deployed at:", address(poc));

        // 3. Deploy Payroll Stream
        PayrollStream payroll = new PayrollStream(deployer);
        console.log("PayrollStream deployed at:", address(payroll));

        // 4. Deploy Slicing Pie Ledger
        SlicingPieLedger pie = new SlicingPieLedger(deployer);
        console.log("SlicingPieLedger deployed at:", address(pie));

        // 5. Deploy Perpetual Purpose Trust
        PerpetualPurposeTrust ppt = new PerpetualPurposeTrust(
            deployer,
            unicode"Sovereign wealth for P31 Founding Nodes \u2014 perpetual, non-charitable, purpose-bound"
        );
        console.log("PerpetualPurposeTrust deployed at:", address(ppt));

        // 6. Deploy Tranche Waterfall
        TrancheWaterfall waterfall = new TrancheWaterfall(deployer);
        console.log("TrancheWaterfall deployed at:", address(waterfall));

        // ── Wire Contracts ──────────────────────────────────────────────
        love.setPoolManager(address(waterfall));
        love.setCareOracle(address(poc));
        console.log("LOVEToken: poolManager = TrancheWaterfall, careOracle = ProofOfCare");

        poc.setLoveToken(address(love));
        console.log("ProofOfCare: loveToken = LOVEToken");

        pie.setPayrollStream(address(payroll));
        console.log("SlicingPieLedger: payrollStream = PayrollStream");

        waterfall.configure(
            address(payroll),
            address(pie),
            address(love),
            address(ppt),
            address(0), // GME bridge — set after deploy
            address(vm.envOr("USDC_ADDRESS", address(0))),
            0.2e18,     // 20% operating reserve
            1000e6      // $1000 sweep threshold (USDC 6 decimals)
        );
        console.log("TrancheWaterfall configured");

        ppt.configure(
            address(love),
            address(waterfall),
            address(0), // GME bridge — set after deploy
            address(vm.envOr("USDC_ADDRESS", address(0)))
        );
        console.log("PerpetualPurposeTrust configured");

        // ── Log Addresses ───────────────────────────────────────────────
        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("LOVEToken:", address(love));
        console.log("ProofOfCare:", address(poc));
        console.log("PayrollStream:", address(payroll));
        console.log("SlicingPieLedger:", address(pie));
        console.log("TrancheWaterfall:", address(waterfall));
        console.log("PerpetualPurposeTrust:", address(ppt));

        vm.stopBroadcast();
    }
}
