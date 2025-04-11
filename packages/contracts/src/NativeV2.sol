// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NativeV2Bounty is Ownable {
    struct Bounty {
        uint256 amount;
        address creator;
        bool isPaid;
    }

    mapping(bytes32 => Bounty) private bounties;
    uint256 private _bountyCounter;

    error BountyAmountZero();
    error IncorrectETHSent();
    error InvalidWinner();
    error BountyNotFound();
    error NotCreator();
    error BountyAlreadyPaid();
    error TransferFailed();
    error WithdrawToZeroAddress();
    error InsufficientBalance();

    event BountyCreated(bytes32 bountyId, address creator, uint256 amount);
    event BountyPaid(bytes32 bountyId, address winner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createBounty(uint256 amount) external payable returns (bytes32) {
        if (amount == 0) revert BountyAmountZero();
        if (msg.value != amount) revert IncorrectETHSent();

        _bountyCounter++;
        bytes32 bountyId = keccak256(
            abi.encodePacked(_bountyCounter, msg.sender, block.timestamp)
        );

        bounties[bountyId] = Bounty({
            amount: amount,
            creator: msg.sender,
            isPaid: false
        });

        emit BountyCreated(bountyId, msg.sender, amount);
        return bountyId;
    }

    function payBounty(bytes32 bountyId, address winner) external {
        if (winner == address(0)) revert InvalidWinner();

        Bounty storage bounty = bounties[bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();
        if (bounty.creator != msg.sender) revert NotCreator();
        if (bounty.isPaid) revert BountyAlreadyPaid();

        bounty.isPaid = true;

        (bool sent, ) = winner.call{value: bounty.amount}("");
        if (!sent) revert TransferFailed();

        emit BountyPaid(bountyId, winner, bounty.amount);
    }

    function getBountyInfo(
        bytes32 bountyId
    ) external view returns (address creator, uint256 amount, bool isPaid) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.creator, bounty.amount, bounty.isPaid);
    }

    function withdraw(uint256 amount, address recipient) external onlyOwner {
        if (recipient == address(0)) revert WithdrawToZeroAddress();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool sent, ) = recipient.call{value: amount}("");
        if (!sent) revert TransferFailed();
    }
}
