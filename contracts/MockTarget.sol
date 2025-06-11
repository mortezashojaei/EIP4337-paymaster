// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockTarget {
    uint256 public counter;
    address public lastCaller;
    
    event CounterIncremented(address indexed caller, uint256 newValue);
    event CounterSet(address indexed caller, uint256 newValue);

    function increment() external {
        counter++;
        lastCaller = msg.sender;
        emit CounterIncremented(msg.sender, counter);
    }

    function setCounter(uint256 _value) external {
        counter = _value;
        lastCaller = msg.sender;
        emit CounterSet(msg.sender, _value);
    }

    function getCounter() external view returns (uint256) {
        return counter;
    }
} 