// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Escrow.sol";

/**
 * @title EscrowFactory
 * @notice Deploys and tracks individual Escrow contracts.
 *         The shared Arbitration address is injected automatically into every
 *         new Escrow so callers never have to supply it.
 */
contract EscrowFactory {
    // ─── Storage ────────────────────────────────────────────────────────────

    address public immutable arbitrationContract;

    uint256 public escrowCount;

    address[] public allEscrows;

    /// @notice All escrows where the given address is the client.
    mapping(address => address[]) public clientEscrows;

    /// @notice All escrows where the given address is the freelancer.
    mapping(address => address[]) public freelancerEscrows;

    /// @notice True only for Escrow contracts deployed by this factory.
    mapping(address => bool) public isEscrow;

    // ─── Events ─────────────────────────────────────────────────────────────

    event EscrowCreated(
        address indexed escrow,
        address indexed client,
        address indexed freelancer,
        address token,
        bytes32 jobMetadataHash
    );

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _arbitrationContract) {
        require(_arbitrationContract != address(0), "Invalid arbitration address");
        arbitrationContract = _arbitrationContract;
    }

    // ─── External Functions ──────────────────────────────────────────────────

    /**
     * @notice Deploy a new Escrow contract. msg.sender becomes the client.
     * @param freelancer      Address of the service provider.
     * @param token           ERC-20 token for payment, or address(0) for ETH.
     * @param jobMetadataHash IPFS / off-chain hash describing the job.
     * @return escrowAddress  Address of the newly deployed Escrow.
     */
    function createEscrow(
        address freelancer,
        address token,
        bytes32 jobMetadataHash
    ) external returns (address escrowAddress) {
        require(freelancer != address(0), "Invalid freelancer address");
        require(freelancer != msg.sender, "Client and freelancer must differ");

        Escrow escrow = new Escrow(
            msg.sender,
            freelancer,
            arbitrationContract,
            token,
            jobMetadataHash
        );

        escrowAddress = address(escrow);

        escrowCount++;
        allEscrows.push(escrowAddress);
        clientEscrows[msg.sender].push(escrowAddress);
        freelancerEscrows[freelancer].push(escrowAddress);
        isEscrow[escrowAddress] = true;

        emit EscrowCreated(escrowAddress, msg.sender, freelancer, token, jobMetadataHash);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getEscrowCount() external view returns (uint256) {
        return escrowCount;
    }

    /// @notice Returns all escrow addresses where `user` is the client.
    function getClientEscrows(address user) external view returns (address[] memory) {
        return clientEscrows[user];
    }

    /// @notice Returns all escrow addresses where `user` is the freelancer.
    function getFreelancerEscrows(address user) external view returns (address[] memory) {
        return freelancerEscrows[user];
    }

    /**
     * @notice Returns (asClient, asFreelancer) escrow lists for a user.
     *         Convenience function for frontends that need both in one call.
     */
    function getUserEscrows(address user)
        external
        view
        returns (address[] memory asClient, address[] memory asFreelancer)
    {
        asClient = clientEscrows[user];
        asFreelancer = freelancerEscrows[user];
    }

    /// @notice Returns true only for Escrow contracts deployed by this factory.
    function isValidEscrow(address escrow) external view returns (bool) {
        return isEscrow[escrow];
    }
}
