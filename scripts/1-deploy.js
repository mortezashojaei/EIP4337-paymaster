const { ethers } = require("hardhat");
const config = require("./utils/config");

async function main() {
    console.log("🚀 Starting Contract Deployment\n");

    // Get signers
    const [deployer, , paymasterOwner] = await ethers.getSigners();
    
    console.log("📝 Deploying contracts...");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Paymaster Owner: ${paymasterOwner.address}\n`);
    
    // Deploy EntryPoint (using the official one from @account-abstraction/contracts)
    console.log("   Deploying EntryPoint...");
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();
    const entryPointAddress = entryPoint.target;
    console.log(`   ✅ EntryPoint deployed at: ${entryPointAddress}`);
    config.saveAddress("ENTRY_POINT_ADDRESS", entryPointAddress);

    // Deploy SimpleAccountFactory
    console.log("   Deploying SimpleAccountFactory...");
    const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
    const accountFactory = await SimpleAccountFactory.deploy(entryPointAddress);
    await accountFactory.waitForDeployment();
    const accountFactoryAddress = accountFactory.target;
    console.log(`   ✅ SimpleAccountFactory deployed at: ${accountFactoryAddress}`);
    config.saveAddress("ACCOUNT_FACTORY_ADDRESS", accountFactoryAddress);

    // Deploy SponsorPaymaster
    console.log("   Deploying SponsorPaymaster...");
    const SponsorPaymaster = await ethers.getContractFactory("SponsorPaymaster");
    const paymaster = await SponsorPaymaster.connect(paymasterOwner).deploy(entryPointAddress);
    await paymaster.waitForDeployment();
    const paymasterAddress = paymaster.target;
    console.log(`   ✅ SponsorPaymaster deployed at: ${paymasterAddress}`);
    config.saveAddress("SPONSOR_PAYMASTER_ADDRESS", paymasterAddress);

    // Deploy MockTarget
    console.log("   Deploying MockTarget...");
    const MockTarget = await ethers.getContractFactory("MockTarget");
    const mockTarget = await MockTarget.deploy();
    await mockTarget.waitForDeployment();
    const mockTargetAddress = mockTarget.target;
    console.log(`   ✅ MockTarget deployed at: ${mockTargetAddress}`);
    config.saveAddress("MOCK_TARGET_ADDRESS", mockTargetAddress);

    // Fund and configure paymaster
    console.log("\n💰 Configuring paymaster...");
    const depositAmount = ethers.parseEther(config.get("PAYMASTER_DEPOSIT_AMOUNT", "1.0"));
    await paymaster.connect(paymasterOwner).depositWithEvent({ value: depositAmount });
    console.log(`   ✅ Paymaster funded with ${ethers.formatEther(depositAmount)} ETH`);

    // Enable sponsorship for all accounts (for demo purposes)
    await paymaster.connect(paymasterOwner).sponsorAllAccounts();
    console.log("   ✅ Enabled sponsorship for all accounts");

    console.log("\n🎉 Deployment Summary:");
    console.log(`   EntryPoint: ${entryPointAddress}`);
    console.log(`   AccountFactory: ${accountFactoryAddress}`);
    console.log(`   SponsorPaymaster: ${paymasterAddress}`);
    console.log(`   MockTarget: ${mockTargetAddress}`);
    console.log("\n✅ All contracts deployed and configured successfully!");
    console.log("📝 Contract addresses saved to .env file");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 