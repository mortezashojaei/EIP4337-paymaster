# ERC-4337 Sponsored Paymaster Scripts

This directory contains decoupled scripts for demonstrating ERC-4337 Account Abstraction with sponsored transactions.

## Scripts Overview

1. **`1-deploy.js`** - Deploy all contracts (EntryPoint, SimpleAccountFactory, SponsorPaymaster, MockTarget)
2. **`2-create-account.js`** - Create smart accounts using deployed contracts
3. **`3-interact.js`** - Execute sponsored transactions using existing contracts and accounts

## Setup

1. Copy the environment template:
   ```bash
   cp scripts/config/env.example .env
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install dotenv
   ```

## Usage

### Step 1: Deploy Contracts
```bash
npx hardhat run scripts/1-deploy.js --network localhost
```

This will:
- Deploy EntryPoint, SimpleAccountFactory, SponsorPaymaster, and MockTarget contracts
- Fund the paymaster with ETH
- Enable sponsorship for all accounts
- Save contract addresses to `.env` file

### Step 2: Create Smart Account
```bash
npx hardhat run scripts/2-create-account.js --network localhost
```

This will:
- Create a new smart account using the deployed contracts
- Verify account initialization
- Save the smart account address to `.env` file

### Step 3: Execute Sponsored Transaction
```bash
npx hardhat run scripts/3-interact.js --network localhost
```

This will:
- Execute a sponsored transaction (increment counter on MockTarget)
- Show that the smart account balance remains unchanged
- Demonstrate that the paymaster paid for the transaction

## Configuration

You can customize the behavior by editing your `.env` file:

```env
# Contract Addresses (auto-populated by scripts)
ENTRY_POINT_ADDRESS=0x...
ACCOUNT_FACTORY_ADDRESS=0x...
SPONSOR_PAYMASTER_ADDRESS=0x...
MOCK_TARGET_ADDRESS=0x...
SMART_ACCOUNT_ADDRESS=0x...

# Gas Configuration
VERIFICATION_GAS_LIMIT=200000
CALL_GAS_LIMIT=200000
MAX_PRIORITY_FEE_PER_GAS=1
MAX_FEE_PER_GAS=10
PRE_VERIFICATION_GAS=50000

# Paymaster Configuration
PAYMASTER_DEPOSIT_AMOUNT=1.0
```

## Architecture

### Utility Modules

- **`utils/config.js`** - Environment variable management and address persistence
- **`utils/userOp.js`** - UserOperation creation and signing helpers

### Script Flow

1. **Deploy** → Saves addresses to `.env`
2. **Create Account** → Reads addresses from `.env`, saves new account address
3. **Interact** → Reads all addresses from `.env`, executes sponsored transactions

## Running All Scripts

You can run all scripts sequentially:

```bash
# Deploy contracts
npx hardhat run scripts/1-deploy.js --network localhost

# Create account
npx hardhat run scripts/2-create-account.js --network localhost

# Execute sponsored transaction
npx hardhat run scripts/3-interact.js --network localhost
```

## Features

- ✅ **Modular Design**: Each script has a single responsibility
- ✅ **Environment-based**: All addresses loaded from environment variables
- ✅ **Reusable**: Scripts can be run multiple times independently
- ✅ **Configurable**: Gas parameters and amounts can be customized
- ✅ **Error Handling**: Validates required addresses before execution
- ✅ **Clean Code**: Shared utilities avoid code duplication

## Troubleshooting

1. **"Address not found" errors**: Make sure to run scripts in order (deploy → create-account → interact)
2. **Transaction failures**: Check that the paymaster has sufficient deposit balance
3. **Nonce errors**: The smart account nonce is managed automatically by the EntryPoint 