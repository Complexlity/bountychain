// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Native_v1 is Ownable {
    IERC20 public usdcToken;
    uint256 private _bountyCounter;

    enum TokenType {
        ETH,
        USDC
    }

    struct Bounty {
        uint256 amount;
        TokenType tokenType;
        address creator;
        bool isPaid;
    }

    mapping(bytes32 => Bounty) private bounties;

    event BountyCreated(
        bytes32 bountyId,
        address creator,
        uint256 amount,
        TokenType tokenType
    );
    event BountyPaid(
        bytes32 bountyId,
        address winner,
        uint256 amount,
        TokenType tokenType
    );

    constructor(
        address initialOwner,
        address _usdcTokenAddress
    ) Ownable(initialOwner) {
        usdcToken = IERC20(_usdcTokenAddress);
    }

    function createBounty(
        TokenType _tokenType,
        uint256 _amount
    ) external payable returns (bytes32) {
        require(_amount > 0, "Bounty amount must be greater than 0");

        if (_tokenType == TokenType.ETH) {
            require(
                msg.value >= _amount,
                "Sent ETH must match the specified amount"
            );
        } else if (_tokenType == TokenType.USDC) {
            require(msg.value == 0, "ETH value must be 0 when using USDC");
            require(
                usdcToken.transferFrom(msg.sender, address(this), _amount),
                "USDC transfer failed"
            );
        }

        _bountyCounter++;
        bytes32 bountyId = keccak256(
            abi.encodePacked(_bountyCounter, msg.sender, block.timestamp)
        );

        bounties[bountyId] = Bounty({
            amount: _amount,
            creator: msg.sender,
            tokenType: _tokenType,
            isPaid: false
        });

        emit BountyCreated(bountyId, msg.sender, _amount, _tokenType);
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

        if (bounty.tokenType == TokenType.ETH) {
            require(
                address(this).balance >= bounty.amount,
                "Not enough ETH to payout bounty"
            );

            (bool sent, ) = _winner.call{value: bounty.amount}("");
            require(sent, "Failed to send Ether");
        } else if (bounty.tokenType == TokenType.USDC) {
            require(
                usdcToken.balanceOf(address(this)) >= bounty.amount,
                "Not enough USDC to payout bounty"
            );
            require(
                usdcToken.transfer(_winner, bounty.amount),
                "USDC transfer failed"
            );
        }

        bounty.isPaid = true;

        emit BountyPaid(_bountyId, _winner, bounty.amount, bounty.tokenType);
    }

    function getBountyInfo(
        bytes32 _bountyId
    )
        external
        view
        returns (
            address creator,
            uint256 amount,
            bool isPaid,
            TokenType tokenType
        )
    {
        Bounty storage bounty = bounties[_bountyId];
        return (bounty.creator, bounty.amount, bounty.isPaid, bounty.tokenType);
    }

    function withdraw(
        uint256 amount,
        TokenType tokenType,
        address recepient
    ) external onlyOwner {
        if (tokenType == TokenType.ETH) {
            require(
                address(this).balance > amount,
                "Withdraw amount exceeds contract balance"
            );
            (bool sent, ) = recepient.call{value: amount}("");
            require(sent, "Failed to withdraw Ether");
            return;
        }
        require(
            usdcToken.balanceOf(address(this)) >= amount,
            "Not enough USDC to withdraw"
        );
        require(usdcToken.transfer(recepient, amount), "USDC transfer failed");
    }
}
