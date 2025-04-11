// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

    error InvalidUSDCAddress();
    error InvalidBountyAmount();
    error InvalidTokenType();
    error IncorrectETHAmount();
    error UnexpectedETH();
    error USDCTransferFailed();
    error BountyNotFound();
    error NotBountyCreator();
    error BountyAlreadyPaid();
    error InvalidWinner();
    error WithdrawToZeroAddress();
    error InsufficientETHBalance();
    error ETHTransferFailed();
    error InsufficientUSDCBalance();

    event BountyCreated(bytes32 bountyId, address creator, uint256 amount, TokenType tokenType);
    event BountyPaid(bytes32 bountyId, address winner, uint256 amount, TokenType tokenType);

    constructor(address initialOwner, address _usdcToken) Ownable(initialOwner) {
        if (_usdcToken == address(0)) revert InvalidUSDCAddress();
        usdcToken = IERC20(_usdcToken);
    }

    function createBounty(TokenType tokenType, uint256 amount) external payable returns (bytes32) {
        if (amount == 0) revert InvalidBountyAmount();
        if (tokenType != TokenType.ETH && tokenType != TokenType.USDC) revert InvalidTokenType();

        bytes32 bountyId;
        _bountyCounter++;
        bountyId = keccak256(abi.encodePacked(_bountyCounter, msg.sender, block.timestamp));

        if (tokenType == TokenType.ETH) {
            if (msg.value != amount) revert IncorrectETHAmount();
        } else {
            if (msg.value != 0) revert UnexpectedETH();
            if (!usdcToken.transferFrom(msg.sender, address(this), amount)) {
                revert USDCTransferFailed();
            }
        }

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
        if (winner == address(0)) revert InvalidWinner();

        Bounty storage bounty = bounties[bountyId];
        if (bounty.creator == address(0)) revert BountyNotFound();
        if (bounty.creator != msg.sender) revert NotBountyCreator();
        if (bounty.isPaid) revert BountyAlreadyPaid();

        bounty.isPaid = true;

        if (bounty.tokenType == TokenType.ETH) {
            (bool sent,) = winner.call{value: bounty.amount}("");
            if (!sent) revert ETHTransferFailed();
        } else {
            if (!usdcToken.transfer(winner, bounty.amount)) {
                revert USDCTransferFailed();
            }
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
        if (recipient == address(0)) revert WithdrawToZeroAddress();

        if (tokenType == TokenType.ETH) {
            if (address(this).balance < amount) revert InsufficientETHBalance();
            (bool sent,) = recipient.call{value: amount}("");
            if (!sent) revert ETHTransferFailed();
        } else {
            if (usdcToken.balanceOf(address(this)) < amount) revert InsufficientUSDCBalance();
            if (!usdcToken.transfer(recipient, amount)) revert USDCTransferFailed();
        }
    }
}
