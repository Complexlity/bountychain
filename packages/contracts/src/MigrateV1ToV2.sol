// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface INativeV1Bounty {
    enum TokenType {
        ETH,
        USDC
    }

    function getBountyInfo(
        bytes32 bountyId
    )
        external
        view
        returns (
            address creator,
            uint256 amount,
            TokenType tokenType,
            bool isPaid
        );
}

interface INativeV2Bounty {
    function createBounty(uint256 amount) external payable returns (bytes32);
}

contract BountyMigrator is Ownable {
    INativeV1Bounty public immutable v1Contract;
    INativeV2Bounty public immutable v2Contract;

    mapping(bytes32 => bytes32) public migrationMap; // v1BountyId => v2BountyId
    mapping(bytes32 => bool) public migratedBounties;

    error MigrationFailed();
    error BountyAlreadyMigrated();
    error OnlyETHBountiesSupported();
    error InsufficientFunds();

    event BountyMigrated(
        bytes32 v1BountyId,
        bytes32 v2BountyId,
        address creator,
        uint256 amount
    );

    constructor(
        address initialOwner,
        address _v1Contract,
        address _v2Contract
    ) Ownable(initialOwner) {
        v1Contract = INativeV1Bounty(_v1Contract);
        v2Contract = INativeV2Bounty(_v2Contract);
    }

    function migrateBounty(bytes32 v1BountyId) external payable onlyOwner {
        if (migratedBounties[v1BountyId]) revert BountyAlreadyMigrated();

        (
            address creator,
            uint256 amount,
            INativeV1Bounty.TokenType tokenType,
            bool isPaid
        ) = v1Contract.getBountyInfo(v1BountyId);

        if (tokenType != INativeV1Bounty.TokenType.ETH)
            revert OnlyETHBountiesSupported();
        if (isPaid) {
            migratedBounties[v1BountyId] = true;
            return;
        }

        if (address(this).balance < amount) revert InsufficientFunds();

        bytes32 v2BountyId = v2Contract.createBounty{value: amount}(amount);

        migrationMap[v1BountyId] = v2BountyId;
        migratedBounties[v1BountyId] = true;

        emit BountyMigrated(v1BountyId, v2BountyId, creator, amount);
    }

    function migrateBounties(
        bytes32[] calldata v1BountyIds
    ) external payable onlyOwner {
        for (uint i = 0; i < v1BountyIds.length; i++) {
            try this.migrateBounty{value: 0}(v1BountyIds[i]) {
            } catch {
            }
        }
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert MigrationFailed();
    }

    receive() external payable {}
}
