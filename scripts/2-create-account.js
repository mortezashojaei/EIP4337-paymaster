const { ethers } = require("hardhat");
const config = require("./utils/config");

async function main() {
    console.log("🏭 Starting Smart Account Creation\n");

    // Get signers
    const [, accountOwner] = await ethers.getSigners();
    
    // Load contract addresses from environment
    const addresses = config.getAddresses();
    
    if (!addresses.entryPoint) {
        throw new Error("EntryPoint address not found. Please run deployment script first.");
    }

    console.log("📋 Configuration:");
    console.log(`   EntryPoint: ${addresses.entryPoint}`);
    console.log(`   Account Owner: ${accountOwner.address}\n`);

    // Create smart account directly
    console.log("🏭 Creating smart account...");
    const SimpleAccountDirect = await ethers.getContractFactory("SimpleAccountDirect");
    const account = await SimpleAccountDirect.deploy(addresses.entryPoint, accountOwner.address);
    await account.waitForDeployment();
    
    const accountAddress = account.target;
    console.log(`   ✅ Smart account created at: ${accountAddress}`);
    console.log(`   Account owner: ${accountOwner.address}`);
    
    // Save account address to environment
    config.saveAddress("SMART_ACCOUNT_ADDRESS", accountAddress);
    
    // Verify account was properly initialized
    const actualOwner = await account.owner();
    console.log(`   Actual owner in contract: ${actualOwner}`);
    
    if (actualOwner.toLowerCase() !== accountOwner.address.toLowerCase()) {
        throw new Error("Account owner mismatch!");
    }

    // Check account balance
    const accountBalance = await ethers.provider.getBalance(accountAddress);
    console.log(`   Smart Account ETH Balance: ${ethers.formatEther(accountBalance)} ETH`);

    console.log("\n🎉 Account Creation Summary:");
    console.log(`   Smart Account Address: ${accountAddress}`);
    console.log(`   Owner Address: ${accountOwner.address}`);
    console.log("\n✅ Smart account created successfully!");
    console.log("📝 Account address saved to .env file");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Account creation failed:", error);
        process.exit(1);
    }); 