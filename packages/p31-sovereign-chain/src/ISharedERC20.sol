// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Shared IERC20 interface for L.O.V.E. ecosystem contracts.
interface ISharedERC20 {
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}
