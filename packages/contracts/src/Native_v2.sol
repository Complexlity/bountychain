// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Native_v2 is Ownable {
    uint256 private _bountyCounter;

    struct Bounty {
        uint256 amount;
        address creator;
        bool isPaid;
    }

    mapping(bytes32 => Bounty) private bounties;

    event BountyCreated(bytes32 bountyId, address creator, uint256 amount);
    event BountyPaid(bytes32 bountyId, address winner, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {
        transferOwnership(initialOwner);
    }

    function createBounty(uint256 _amount) external payable returns (bytes32) {
        require(_amount > 0, "Bounty amount must be greater than 0");
        require(
            msg.value >= _amount,
            "Sent ETH must match the specified amount"
        );

        _bountyCounter++;
        bytes32 bountyId = keccak256(
            abi.encodePacked(_bountyCounter, msg.sender, block.timestamp)
        );

        bounties[bountyId] = Bounty({
            amount: _amount,
            creator: msg.sender,
            isPaid: false
        });

        emit BountyCreated(bountyId, msg.sender, _amount);
        return bountyId;
    }

    function payBounty(bytes32 _bountyId, address payable _winner) external {
        Bounty storage bounty = bounties[_bountyId];
        require(
            msg.sender == bounty.creator || msg.sender == owner(),
            "Only the creator or contract owner can pay the bounty"
        );
        require(!bounty.isPaid, "Bounty has already been paid");
        require(bounty.amount > 0, "Invalid bounty");
        require(
            address(this).balance >= bounty.amount,
            "Not enough ETH to payout bounty"
        );

        (bool sent, ) = _winner.call{value: bounty.amount}("");
        require(sent, "Failed to send Ether");

        bounty.isPaid = true;

        emit BountyPaid(_bountyId, _winner, bounty.amount);
    }

    function getBountyInfo(
        bytes32 _bountyId
    ) external view returns (address creator, uint256 amount, bool isPaid) {
        Bounty storage bounty = bounties[_bountyId];
        return (bounty.creator, bounty.amount, bounty.isPaid);
    }

    function withdraw(uint256 amount, address recepient) external onlyOwner {
        require(
            address(this).balance >= amount,
            "Withdraw amount exceeds contract balance"
        );
        (bool sent, ) = recepient.call{value: amount}("");
        require(sent, "Failed to withdraw Ether");
    }
}
