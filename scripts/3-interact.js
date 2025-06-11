const { ethers } = require("hardhat");
const config = require("./utils/config");
const { createUserOp, signUserOp } = require("./utils/userOp");

async function main() {
    console.log("⚡ Starting Sponsored Transaction Interaction\n");

    // Get signers
    const [deployer, accountOwner] = await ethers.getSigners();
    
    // Load contract addresses from environment
    const addresses = config.getAddresses();
    const gasConfig = config.getGasConfig();
    
    // Validate required addresses
    const requiredAddresses = ['entryPoint', 'sponsorPaymaster', 'mockTarget', 'smartAccount'];
    for (const addr of requiredAddresses) {
        if (!addresses[addr]) {
            throw new Error(`${addr} address not found. Please run previous scripts first.`);
        }
    }

    console.log("📋 Configuration:");
    console.log(`   EntryPoint: ${addresses.entryPoint}`);
    console.log(`   Smart Account: ${addresses.smartAccount}`);
    console.log(`   Sponsor Paymaster: ${addresses.sponsorPaymaster}`);
    console.log(`   Mock Target: ${addresses.mockTarget}`);
    console.log(`   Account Owner: ${accountOwner.address}\n`);

    // Connect to existing contracts
    const entryPoint = await ethers.getContractAt("EntryPoint", addresses.entryPoint);
    const paymaster = await ethers.getContractAt("SponsorPaymaster", addresses.sponsorPaymaster);
    const mockTarget = await ethers.getContractAt("MockTarget", addresses.mockTarget);
    const account = await ethers.getContractAt("SimpleAccountDirect", addresses.smartAccount);

    // Log initial balances
    console.log("📊 Initial Balances:");
    const smartAccountBalance = await ethers.provider.getBalance(addresses.smartAccount);
    const paymasterDeposit = await paymaster.getDeposit();
    console.log(`   Smart Account ETH Balance: ${ethers.formatEther(smartAccountBalance)} ETH`);
    console.log(`   Paymaster Deposit Balance: ${ethers.formatEther(paymasterDeposit)} ETH`);
    
    // Check initial counter value
    const initialCounter = await mockTarget.getCounter();
    console.log(`   Initial Counter Value: ${initialCounter.toString()}\n`);

    // Prepare sponsored transaction
    console.log("🎯 Preparing sponsored transaction...");
    const targetCallData = mockTarget.interface.encodeFunctionData("increment");
    
    // Get nonce
    const nonce = await entryPoint.getNonce(addresses.smartAccount, 0);
    
    // Create UserOperation
    let userOp = createUserOp(account, addresses.mockTarget, targetCallData, nonce, gasConfig);
    
    // Add paymaster data with gas limits
    const paymasterVerificationGasLimit = 100000;
    const paymasterPostOpGasLimit = 50000;
    userOp.paymasterAndData = ethers.solidityPacked(
        ["address", "uint128", "uint128"],
        [addresses.sponsorPaymaster, paymasterVerificationGasLimit, paymasterPostOpGasLimit]
    );
    
    // Sign the UserOperation  
    const network = await ethers.provider.getNetwork();
    userOp.signature = await signUserOp(userOp, accountOwner, addresses.entryPoint, Number(network.chainId));
    
    console.log("   ✅ UserOperation created and signed");
    console.log(`   Target function: increment()`);
    console.log(`   Using paymaster: ${addresses.sponsorPaymaster}`);
    console.log(`   Nonce: ${nonce.toString()}\n`);

    // Execute sponsored transaction
    console.log("⚡ Executing sponsored transaction...");
    try {
        const tx = await entryPoint.handleOps([userOp], deployer.address);
        const receipt = await tx.wait();
        console.log(`   ✅ Transaction executed successfully!`);
        console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`   Transaction hash: ${receipt.hash}\n`);
    } catch (error) {
        console.error("❌ Transaction failed:", error.message);
        return;
    }

    // Verify the transaction was executed
    console.log("✅ Verifying transaction execution...");
    const counterValue = await mockTarget.getCounter();
    const lastCaller = await mockTarget.lastCaller();
    console.log(`   Counter value: ${counterValue.toString()} (was ${initialCounter.toString()})`);
    console.log(`   Last caller: ${lastCaller}`);
    console.log(`   Expected caller: ${addresses.smartAccount}`);
    
    if (lastCaller.toLowerCase() !== addresses.smartAccount.toLowerCase()) {
        console.error("❌ Wrong caller! Transaction may not have executed correctly.");
        return;
    }
    
    if (counterValue <= initialCounter) {
        console.error("❌ Counter not incremented! Transaction may have failed.");
        return;
    }

    // Log final balances
    console.log("\n📊 Final Balances:");
    const smartAccountBalanceAfter = await ethers.provider.getBalance(addresses.smartAccount);
    const paymasterDepositAfter = await paymaster.getDeposit();
    
    console.log(`   Smart Account ETH Balance: ${ethers.formatEther(smartAccountBalanceAfter)} ETH`);
    console.log(`   Paymaster Deposit Balance: ${ethers.formatEther(paymasterDepositAfter)} ETH`);

    // Show the sponsorship effect
    console.log("\n🎉 Sponsorship Summary:");
    const smartAccountChange = smartAccountBalanceAfter - smartAccountBalance;
    const paymasterChange = paymasterDepositAfter - paymasterDeposit;
    
    console.log(`   Smart Account Balance Change: ${ethers.formatEther(smartAccountChange)} ETH`);
    console.log(`   Paymaster Deposit Change: ${ethers.formatEther(paymasterChange)} ETH`);
    
    if (smartAccountChange == 0n && paymasterChange < 0n) {
        console.log("   ✅ SUCCESS: Transaction was sponsored by paymaster!");
        console.log("   ✅ Smart account balance unchanged");
        console.log("   ✅ Paymaster paid for the transaction");
    } else {
        console.log("   ❌ Something went wrong with sponsorship");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Interaction failed:", error);
        process.exit(1);
    }); 