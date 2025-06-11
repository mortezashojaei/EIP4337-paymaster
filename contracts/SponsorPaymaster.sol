// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/core/Helpers.sol";

contract SponsorPaymaster is BasePaymaster {
    
    mapping(address => bool) public sponsoredAccounts;
    uint256 public maxCostOfPostOp;

    event AccountSponsored(address indexed account);
    event AccountUnsponsored(address indexed account);
    event PaymasterDeposited(uint256 amount);
    event PaymasterWithdrawn(uint256 amount);

    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {
        maxCostOfPostOp = 50000; // Default gas limit for postOp
    }

    function addSponsoredAccount(address account) external onlyOwner {
        sponsoredAccounts[account] = true;
        emit AccountSponsored(account);
    }

    function removeSponsoredAccount(address account) external onlyOwner {
        sponsoredAccounts[account] = false;
        emit AccountUnsponsored(account);
    }

    function sponsorAllAccounts() external onlyOwner {
        // For demo purposes - sponsor any account (not recommended for production)
        sponsoredAccounts[address(0)] = true; // Use address(0) as wildcard
    }

    function _validatePaymasterUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 maxCost)
    internal view override returns (bytes memory context, uint256 validationData) {
        // Check if account is sponsored or if we're sponsoring all accounts
        if (!sponsoredAccounts[userOp.sender] && !sponsoredAccounts[address(0)]) {
            return ("", _packValidationData(true, 0, 0));
        }

        // Check if paymaster has enough deposit
        if (getDeposit() < maxCost) {
            return ("", _packValidationData(true, 0, 0));
        }

        return (abi.encode(userOp.sender, maxCost), 0);
    }

    function _postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost, uint256 actualUserOpFeePerGas) internal override {
        // Could implement additional logic here (refunds, logging, etc.)
        if (context.length > 0) {
            (address account, uint256 maxCost) = abi.decode(context, (address, uint256));
            // Additional post-operation logic can be added here
        }
    }

    function depositWithEvent() public payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit PaymasterDeposited(msg.value);
    }

    receive() external payable {
        depositWithEvent();
    }
} 