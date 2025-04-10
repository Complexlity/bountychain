// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Sum {
    // This contracts tries to add stuff
    uint public currentSum;

    function getCurrentSum() public view returns (uint) {
        console.log("Current Sum", currentSum);
        return currentSum;
    }

    function add(uint _a) public {
        console.log("Sender", msg.sender);
        console.log("Current Sum before adding", currentSum);
        currentSum += _a;
        console.log("Current Sum after adding", currentSum);
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
