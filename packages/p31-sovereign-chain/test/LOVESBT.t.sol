// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LOVESBT.sol";

contract LOVESBTTest is Test {
    LOVESBT loveSBT;
    address owner = address(0x1);
    address oracle = address(0x2);
    address user = address(0x3);
    address stranger = address(0x4);

    function setUp() public {
        loveSBT = new LOVESBT(owner, oracle);
    }

    // ── Mint Tests ─────────────────────────────────────────────────────
    function testMintSingle() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.7e18, 2, "ipfs://test");

        assertEq(loveSBT.balanceOf(user), 1);
        assertEq(loveSBT.ownerOf(0), user);
        (uint256 score,,,) = loveSBT.reputationData(0);
        assertEq(score, 0.7e18);
        (, uint256 tier,,) = loveSBT.reputationData(0);
        assertEq(tier, 2);
        assertEq(loveSBT.getSBTs(user).length, 1);
    }

    function testMintByOracle() public {
        vm.prank(oracle);
        loveSBT.mintSBT(user, 0.5e18, 1, "ipfs://oracle");

        assertEq(loveSBT.ownerOf(0), user);
        (uint256 score,,,) = loveSBT.reputationData(0);
        assertEq(score, 0.5e18);
    }

    function testMintRevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(LOVESBT.ZeroAddress.selector);
        loveSBT.mintSBT(address(0), 0.5e18, 1, "ipfs://test");
    }

    function testMintRevertsOnUnauthorized() public {
        vm.prank(stranger);
        vm.expectRevert(LOVESBT.Unauthorized.selector);
        loveSBT.mintSBT(user, 0.5e18, 1, "ipfs://test");
    }

    // ── Update Tests ───────────────────────────────────────────────────
    function testUpdateReputation() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.5e18, 1, "ipfs://test");

        vm.prank(owner);
        loveSBT.updateReputation(0, 0.9e18);

        (uint256 score,,,) = loveSBT.reputationData(0); assertEq(score, 0.9e18);
        assertEq(loveSBT.balanceOf(user), 1);
    }

    function testUpdateByOracle() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.5e18, 1, "ipfs://test");

        vm.prank(oracle);
        loveSBT.updateReputation(0, 0.8e18);

        (uint256 score,,,) = loveSBT.reputationData(0); assertEq(score, 0.8e18);
    }

    // ── Batch Mint Tests ───────────────────────────────────────────────
    function testSafeMintBatch() public {
        vm.prank(owner);
        loveSBT.safeMintBatch(user, 5);

        assertEq(loveSBT.getSBTs(user).length, 5);
        assertEq(loveSBT.ownerOf(0), user);
        assertEq(loveSBT.ownerOf(4), user);
        (uint256 score,,,) = loveSBT.reputationData(2); assertEq(score, 0);
    }

    // ── Burn Tests ─────────────────────────────────────────────────────
    function testBurnByOwner() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.6e18, 1, "ipfs://test");

        assertEq(loveSBT.balanceOf(user), 1);

        vm.prank(user);
        loveSBT.burn(0);

        assertEq(loveSBT.balanceOf(user), 0);
        assertEq(loveSBT.getSBTs(user).length, 0);
    }

    function testBurnByAdmin() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.6e18, 1, "ipfs://test");

        assertEq(loveSBT.balanceOf(user), 1);

        vm.prank(owner);
        loveSBT.burn(0);

        assertEq(loveSBT.balanceOf(user), 0);
        assertEq(loveSBT.getSBTs(user).length, 0);
    }

    function testBurnRevertsOnUnauthorized() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.6e18, 1, "ipfs://test");

        vm.prank(stranger);
        vm.expectRevert("Not authorized");
        loveSBT.burn(0);
    }

    // ── Soulbound Tests ────────────────────────────────────────────────
    function testCannotTransfer() public {
        vm.prank(owner);
        loveSBT.mintSBT(user, 0.6e18, 1, "ipfs://test");

        vm.prank(user);
        vm.expectRevert(LOVESBT.SoulboundTransferNotAllowed.selector);
        loveSBT.transferFrom(user, stranger, 0);

        vm.prank(user);
        vm.expectRevert(LOVESBT.SoulboundTransferNotAllowed.selector);
        loveSBT.safeTransferFrom(user, stranger, 0);

        vm.prank(user);
        vm.expectRevert(LOVESBT.SoulboundTransferNotAllowed.selector);
        loveSBT.approve(stranger, 0);

        vm.prank(user);
        vm.expectRevert(LOVESBT.SoulboundTransferNotAllowed.selector);
        loveSBT.setApprovalForAll(stranger, true);
    }

    // ── Oracle Tests ───────────────────────────────────────────────────
    function testSetOracle() public {
        address newOracle = address(0x5);
        vm.prank(owner);
        loveSBT.setOracle(newOracle);
        assertEq(loveSBT.oracle(), newOracle);

        vm.prank(newOracle);
        loveSBT.mintSBT(user, 0.5e18, 1, "ipfs://new-oracle");
        assertEq(loveSBT.ownerOf(0), user);
    }

    function testSetOracleRevertsOnZero() public {
        vm.prank(owner);
        vm.expectRevert(LOVESBT.ZeroAddress.selector);
        loveSBT.setOracle(address(0));
    }

    // ── Integration: ProofOfCare mints SBT ─────────────────────────────
    function testProofOfCareMintsSBT() public {
        // Deploy LOVEToken
        // Note: LOVEToken no longer needed for SBT minting directly

        // Simulate ProofOfCare minting via oracle permission
        vm.prank(oracle);
        loveSBT.mintSBT(user, 0.8e18, 2, "ipfs://poc-mint");

        assertEq(loveSBT.ownerOf(0), user);
        (uint256 score,,,) = loveSBT.reputationData(0); assertEq(score, 0.8e18);
        (, uint256 tier,,) = loveSBT.reputationData(0); assertEq(tier, 2);
        assertEq(loveSBT.getSBTs(user).length, 1);
    }

    function testMultipleUsersEarnSBTs() public {
        address[] memory users = new address[](3);
        users[0] = user;
        users[1] = address(0x5);
        users[2] = address(0x6);

        for (uint256 i = 0; i < users.length; i++) {
            vm.prank(oracle);
            loveSBT.mintSBT(users[i], uint256(0.5e18 + i * 0.1e18), i + 1, string(abi.encodePacked("ipfs://sbt/", vm.toString(i))));
        }

        assertEq(loveSBT.getSBTs(user).length, 1);
        assertEq(loveSBT.getSBTs(users[1]).length, 1);
        assertEq(loveSBT.getSBTs(users[2]).length, 1);
        assertEq(loveSBT.ownerOf(0), user);
        assertEq(loveSBT.ownerOf(1), users[1]);
        assertEq(loveSBT.ownerOf(2), users[2]);
    }
}
