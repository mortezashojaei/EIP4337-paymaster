# ERC-4337 Sponsored Paymaster Demo

A minimal Hardhat project demonstrating ERC-4337 Account Abstraction with sponsored transactions using a Paymaster.

## Overview

This project showcases how to implement sponsored transactions where:
- **Smart Account**: User's smart contract wallet that executes transactions
- **Paymaster**: Pays for transaction gas fees on behalf of users
- **EntryPoint**: ERC-4337 singleton contract that handles UserOperation execution

## Features

- ✅ Simple smart account implementation
- ✅ Sponsored paymaster that pays for user transactions
- ✅ Demo script showing balance changes
- ✅ Clear logging to demonstrate sponsorship effect

## Prerequisites

- Node.js >= 16
- npm or yarn

## Installation

```bash
npm install
```

## Usage

### 1. Compile Contracts

```bash
npm run compile
```

### 2. Run the Demo

```bash
npm run demo
```

This will:
1. Deploy all necessary contracts (EntryPoint, SimpleAccount, SponsorPaymaster, MockTarget)
2. Create a smart account for a user
3. Fund the paymaster with ETH
4. Execute a sponsored transaction (increment counter)
5. Show balance changes proving the transaction was sponsored

### 3. Expected Output

```
🚀 Starting ERC-4337 Sponsored Paymaster Demo

📝 Deploying contracts...
   EntryPoint deployed at: 0x...
   SimpleAccountFactory deployed at: 0x...
   SponsorPaymaster deployed at: 0x...
   MockTarget deployed at: 0x...

🏭 Creating smart account...
   Smart account created at: 0x...
   Account owner: 0x...

💰 Funding paymaster...
   Paymaster funded with 1.0 ETH
   Enabled sponsorship for all accounts

📊 Initial Balances:
   Smart Account ETH Balance: 0.0 ETH
   Paymaster Deposit Balance: 1.0 ETH

🎯 Preparing sponsored transaction...
   UserOperation created and signed
   Target function: increment()
   Using paymaster: 0x...

⚡ Executing sponsored transaction...
   Transaction executed successfully!
   Gas used: 123456
   Transaction hash: 0x...

✅ Verifying transaction execution...
   Counter value: 1
   Last caller: 0x... (should be smart account address)

📊 Final Balances:
   Smart Account ETH Balance: 0.0 ETH
   Paymaster Deposit Balance: 0.999... ETH

🎉 Sponsorship Summary:
   Smart Account Balance Change: 0.0 ETH
   Paymaster Deposit Change: -0.000... ETH
   ✅ SUCCESS: Transaction was sponsored by paymaster!
   ✅ Smart account balance unchanged
   ✅ Paymaster paid for the transaction
```

## Project Structure

```
├── contracts/
│   ├── SimpleAccount.sol          # Smart account implementation
│   ├── SimpleAccountFactory.sol   # Factory for creating accounts
│   ├── SponsorPaymaster.sol       # Paymaster that sponsors transactions
│   └── MockTarget.sol             # Simple contract for demo calls
├── scripts/
│   └── demo.js                    # Main demonstration script
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## Key Concepts

### Smart Account
- Implements ERC-4337 `BaseAccount`
- Owned by an EOA (Externally Owned Account)
- Can execute transactions when called through EntryPoint
- Validates signatures from the owner

### Paymaster
- Implements ERC-4337 `BasePaymaster`
- Pre-funded with ETH deposited to EntryPoint
- Validates which accounts it will sponsor
- Pays gas fees for sponsored UserOperations

### UserOperation
- ERC-4337 transaction format
- Contains all transaction data plus gas parameters
- Signed by account owner
- Executed through EntryPoint

## How It Works

1. **Setup**: Deploy EntryPoint, create smart account, deploy and fund paymaster
2. **Transaction Preparation**: Create UserOperation with target call data
3. **Sponsorship**: Add paymaster address to UserOperation
4. **Execution**: Submit to EntryPoint which:
   - Validates the account signature
   - Validates the paymaster will pay
   - Executes the transaction
   - Charges gas to paymaster instead of account

## Key Files

- `SimpleAccount.sol`: Basic smart account that can execute calls
- `SponsorPaymaster.sol`: Paymaster that sponsors transactions for registered accounts
- `demo.js`: Complete demonstration showing sponsored transaction flow

## Development

### Run Tests (if any)
```bash
npm test
```

### Start Local Network
```bash
npm run node
```

## Notes

- This is a minimal implementation for educational purposes
- Production paymasters should have proper access controls and validation
- The demo sponsors all accounts for simplicity
- Real implementations should have more sophisticated gas estimation

## Learn More

- [ERC-4337 Standard](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Documentation](https://docs.stackup.sh/)
- [Hardhat Documentation](https://hardhat.org/docs) 