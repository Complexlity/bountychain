// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NativeV1Bounty is Ownable {
    IERC20 public immutable usdcToken;
    
    enum TokenType { ETH, USDC }
    
    struct Bounty {
        uint256 amount;
        address creator;
        TokenType tokenType;
        bool isPaid;
    }
    
    mapping(bytes32 => Bounty) private bounties;
    uint256 private _bountyCounter;
    
    event BountyCreated(bytes32 bountyId, address creator, uint256 amount, TokenType tokenType);
    event BountyPaid(bytes32 bountyId, address winner, uint256 amount, TokenType tokenType);
    
    constructor(address initialOwner, address _usdcToken) Ownable(initialOwner) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        usdcToken = IERC20(_usdcToken);
    }
    
    function createBounty(TokenType tokenType, uint256 amount) external payable returns (bytes32) {
        require(amount > 0, "Bounty amount must be greater than 0");
        require(tokenType == TokenType.ETH || tokenType == TokenType.USDC, "Invalid token type");

        bytes32 bountyId;
        
        if (tokenType == TokenType.ETH) {
            require(msg.value == amount, "ETH value must match bounty amount");
        } else {
            require(msg.value == 0, "Don't send ETH with USDC bounty");
            
            _bountyCounter++;
            bountyId = keccak256(abi.encodePacked(_bountyCounter, msg.sender, block.timestamp));
            
            bounties[bountyId] = Bounty({
                amount: amount,
                creator: msg.sender,
                tokenType: tokenType,
                isPaid: false
            });
            
            require(
                usdcToken.transferFrom(msg.sender, address(this), amount),
                "USDC transfer failed"
            );
            
            emit BountyCreated(bountyId, msg.sender, amount, tokenType);
            return bountyId;
        }
        
        _bountyCounter++;
        bountyId = keccak256(abi.encodePacked(_bountyCounter, msg.sender, block.timestamp));
        
        bounties[bountyId] = Bounty({
            amount: amount,
            creator: msg.sender,
            tokenType: tokenType,
            isPaid: false
        });
        
        emit BountyCreated(bountyId, msg.sender, amount, tokenType);
        return bountyId;
    }
    
    function payBounty(bytes32 bountyId, address winner) external {
        require(winner != address(0), "Invalid winner address");
        
        Bounty storage bounty = bounties[bountyId];
        require(bounty.creator != address(0), "Bounty does not exist");
        require(bounty.creator == msg.sender, "Only creator can pay bounty");
        require(!bounty.isPaid, "Bounty has already been paid");
        
        bounty.isPaid = true;
        
        if (bounty.tokenType == TokenType.ETH) {
            (bool sent,) = winner.call{value: bounty.amount}("");
            require(sent, "Failed to send ETH");
        } else if (bounty.tokenType == TokenType.USDC) {
            require(
                usdcToken.transfer(winner, bounty.amount),
                "USDC transfer failed"
            );
        }
        
        emit BountyPaid(bountyId, winner, bounty.amount, bounty.tokenType);
    }
    
    function getBountyInfo(bytes32 bountyId) external view returns (
        address creator,
        uint256 amount,
        TokenType tokenType,
        bool isPaid
    ) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.creator, bounty.amount, bounty.tokenType, bounty.isPaid);
    }
    
    function withdraw(uint256 amount, TokenType tokenType, address recipient) external onlyOwner {
        require(recipient != address(0), "Cannot withdraw to zero address");
        
        if (tokenType == TokenType.ETH) {
            require(address(this).balance >= amount, "Not enough ETH to withdraw");
            (bool sent,) = recipient.call{value: amount}("");
            require(sent, "Failed to send ETH");
        } else if (tokenType == TokenType.USDC) {
            require(usdcToken.balanceOf(address(this)) >= amount, "Not enough USDC to withdraw");
            require(usdcToken.transfer(recipient, amount), "USDC transfer failed");
        }
    }
}