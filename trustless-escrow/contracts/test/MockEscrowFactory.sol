// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Test stub for IEscrowFactory.
 *         Allows tests to manually register escrow addresses.
 */
contract MockEscrowFactory {
    mapping(address => bool) private _valid;

    function register(address escrow) external {
        _valid[escrow] = true;
    }

    function isValidEscrow(address escrow) external view returns (bool) {
        return _valid[escrow];
    }
}
