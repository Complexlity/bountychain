// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenBountyContract is Ownable {
    using Counters for Counters.Counter;

    IERC20 public immutable token;
    uint8 public immutable decimals;
    string public symbol;
    Counters.Counter private _bountyCounter;

    struct Bounty {
        uint256 amount;
        address creator;
        bool isPaid;
    }

    mapping(bytes32 => Bounty) private bounties;

    event BountyCreated(bytes32 bountyId, address creator, uint256 amount);
    event BountyPaid(bytes32 bountyId, address winner, uint256 amount);

    constructor(
        address initialOwner,
        address _tokenAddress
    ) Ownable(initialOwner) {
        require(_tokenAddress != address(0), "Invalid token address");
        token = IERC20(_tokenAddress);

        // Get token decimals using the metadata extension
        decimals = IERC20Metadata(_tokenAddress).decimals();
        symbol = IERC20Metadata(_tokenAddress).symbol();
    }

    function createBounty(uint256 _amount) external returns (bytes32) {
        require(_amount > 0, "Bounty amount must be greater than 0");
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        _bountyCounter.increment();
        bytes32 bountyId = keccak256(
            abi.encodePacked(
                _bountyCounter.current(),
                msg.sender,
                block.timestamp
            )
        );

        bounties[bountyId] = Bounty({
            amount: _amount,
            creator: msg.sender,
            isPaid: false
        });

        emit BountyCreated(bountyId, msg.sender, _amount);
        return bountyId;
    }

    function payBounty(bytes32 _bountyId, address _winner) external {
        Bounty storage bounty = bounties[_bountyId];
        require(
            msg.sender == bounty.creator || msg.sender == owner(),
            "Only the creator or contract owner can pay the bounty"
        );
        require(!bounty.isPaid, "Bounty has already been paid");
        require(bounty.amount > 0, "Invalid bounty");

        require(
            token.balanceOf(address(this)) >= bounty.amount,
            "Not enough tokens to payout bounty"
        );
        require(
            token.transfer(_winner, bounty.amount),
            "Token transfer failed"
        );

        bounty.isPaid = true;

        emit BountyPaid(_bountyId, _winner, bounty.amount);
    }

    function getBountyInfo(
        bytes32 _bountyId
    ) external view returns (address creator, uint256 amount, bool isPaid) {
        Bounty storage bounty = bounties[_bountyId];
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
