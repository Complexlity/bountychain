// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Bounty is Ownable {
    IERC20 public immutable token;
    uint8 public immutable decimals;
    string public symbol;
    uint256 private bountyCounter;

    struct Bounty {
        uint256 amount;
        address creator;
        bool isPaid;
    }

    mapping(bytes32 => Bounty) private bounties;

    event BountyCreated(bytes32 bountyId, address indexed creator, uint256 amount);
    event BountyPaid(bytes32 bountyId, address indexed winner, uint256 amount);

    constructor(address initialOwner, address tokenAddress) Ownable(initialOwner) {
        require(tokenAddress != address(0), "Invalid token address");
        token = IERC20(tokenAddress);

        decimals = IERC20Metadata(tokenAddress).decimals();
        symbol = IERC20Metadata(tokenAddress).symbol();
    }

    function createBounty(uint256 amount) external returns (bytes32) {
        require(amount > 0, "Bounty amount must be greater than 0");

        bountyCounter++;
        bytes32 bountyId = keccak256(
            abi.encodePacked(bountyCounter, msg.sender, block.timestamp)
        );
        bounties[bountyId] = Bounty({
            amount: amount,
            creator: msg.sender,
            isPaid: false
        });

        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        emit BountyCreated(bountyId, msg.sender, amount);
        return bountyId;
    }

    function payBounty(bytes32 bountyId, address winner) external {
        Bounty storage bounty = bounties[bountyId];

        require(
            msg.sender == bounty.creator || msg.sender == owner(),
            "Only creator or owner can pay the bounty"
        );
        require(!bounty.isPaid, "Bounty already paid");
        require(bounty.amount > 0, "Invalid bounty");

        bounty.isPaid = true;

        require(
            token.transfer(winner, bounty.amount),
            "Token transfer failed"
        );

        emit BountyPaid(bountyId, winner, bounty.amount);
    }

    function getBountyInfo(
        bytes32 bountyId
    ) external view returns (address creator, uint256 amount, bool isPaid) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.creator, bounty.amount, bounty.isPaid);
    }

    function withdraw(uint256 amount, address recipient) external onlyOwner {
        require(
            token.balanceOf(address(this)) >= amount,
            "Not enough tokens to withdraw"
        );
        require(token.transfer(recipient, amount), "Token transfer failed");
    }
}
