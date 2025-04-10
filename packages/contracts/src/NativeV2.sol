// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NativeV2Bounty is Ownable {
    struct Bounty {
        uint256 amount;
        address creator;
        bool isPaid;
    }

    mapping(bytes32 => Bounty) private bounties;
    uint256 private _bountyCounter;

    event BountyCreated(bytes32 bountyId, address creator, uint256 amount);
    event BountyPaid(bytes32 bountyId, address winner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createBounty(uint256 amount) external payable returns (bytes32) {
        require(amount > 0, "Bounty amount must be greater than 0");
        require(msg.value == amount, "ETH value must match bounty amount");

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
        require(winner != address(0), "Invalid winner address");

        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "Bounty does not exist");
        require(bounty.creator == msg.sender, "Only creator can pay bounty");
        require(!bounty.isPaid, "Bounty has already been paid");

        // Update state BEFORE external calls (effects)
        bounty.isPaid = true;

        // External calls AFTER state updates (interactions)
        (bool sent, ) = winner.call{value: bounty.amount}("");
        require(sent, "Failed to send ETH");

        emit BountyPaid(bountyId, winner, bounty.amount);
    }

    function getBountyInfo(
        bytes32 bountyId
    ) external view returns (address creator, uint256 amount, bool isPaid) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.creator, bounty.amount, bounty.isPaid);
    }

    function withdraw(uint256 amount, address recipient) external onlyOwner {
        require(recipient != address(0), "Cannot withdraw to zero address");
        require(address(this).balance >= amount, "Not enough ETH to withdraw");

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Failed to send ETH");
    }
}
