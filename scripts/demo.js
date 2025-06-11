const { ethers } = require("hardhat");

// Helper function to create PackedUserOperation
function createUserOp(account, target, data, nonce = 0) {
    // Pack gas limits: [verificationGasLimit(128 bits)][callGasLimit(128 bits)]
    const verificationGasLimit = 200000;
    const callGasLimit = 200000;
    const accountGasLimits = ethers.solidityPacked(
        ["uint128", "uint128"], 
        [verificationGasLimit, callGasLimit]
    );
    
    // Pack gas fees: [maxPriorityFeePerGas(128 bits)][maxFeePerGas(128 bits)]
    const maxPriorityFeePerGas = ethers.parseUnits("1", "gwei");
    const maxFeePerGas = ethers.parseUnits("10", "gwei");
    const gasFees = ethers.solidityPacked(
        ["uint128", "uint128"], 
        [maxPriorityFeePerGas, maxFeePerGas]
    );

    return {
        sender: account.target,
        nonce: nonce,
        initCode: "0x",
        callData: account.interface.encodeFunctionData("execute", [target, 0, data]),
        accountGasLimits: accountGasLimits,
        preVerificationGas: 50000,
        gasFees: gasFees,
        paymasterAndData: "0x",
        signature: "0x"
    };
}

// Helper function to sign PackedUserOperation
async function signUserOp(userOp, signer, entryPointAddress, chainId) {
    // First create the UserOperation hash
    const userOpHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            [
                "address", "uint256", "bytes32", "bytes32", "bytes32", 
                "uint256", "bytes32", "bytes32"
            ],
            [
                userOp.sender,
                userOp.nonce,
                ethers.keccak256(userOp.initCode),
                ethers.keccak256(userOp.callData),
                userOp.accountGasLimits,
                userOp.preVerificationGas,
                userOp.gasFees,
                ethers.keccak256(userOp.paymasterAndData)
            ]
        )
    );

    // Then create the final hash with EntryPoint and chain ID
    const finalHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "uint256"],
            [userOpHash, entryPointAddress, chainId]
        )
    );

    const signature = await signer.signMessage(ethers.getBytes(finalHash));
    return signature;
}

async function main() {
    console.log("🚀 Starting ERC-4337 Sponsored Paymaster Demo\n");

    // Get signers
    const [deployer, accountOwner, paymasterOwner] = await ethers.getSigners();
    
    console.log("📝 Deploying contracts...");
    
    // Deploy EntryPoint (using the official one from @account-abstraction/contracts)
    const EntryPoint = await ethers.getContractFactory("EntryPoint");
    const entryPoint = await EntryPoint.deploy();
    await entryPoint.waitForDeployment();
    console.log(`   EntryPoint deployed at: ${entryPoint.target}`);

    // Deploy SimpleAccountFactory
    const SimpleAccountFactory = await ethers.getContractFactory("SimpleAccountFactory");
    const accountFactory = await SimpleAccountFactory.deploy(entryPoint.target);
    await accountFactory.waitForDeployment();
    console.log(`   SimpleAccountFactory deployed at: ${accountFactory.target}`);

    // Deploy SponsorPaymaster
    const SponsorPaymaster = await ethers.getContractFactory("SponsorPaymaster");
    const paymaster = await SponsorPaymaster.connect(paymasterOwner).deploy(entryPoint.target);
    await paymaster.waitForDeployment();
    console.log(`   SponsorPaymaster deployed at: ${paymaster.target}`);

    // Deploy MockTarget
    const MockTarget = await ethers.getContractFactory("MockTarget");
    const mockTarget = await MockTarget.deploy();
    await mockTarget.waitForDeployment();
    console.log(`   MockTarget deployed at: ${mockTarget.target}\n`);

    // Create smart account directly
    console.log("🏭 Creating smart account...");
    const SimpleAccountDirect = await ethers.getContractFactory("SimpleAccountDirect");
    const account = await SimpleAccountDirect.deploy(entryPoint.target, accountOwner.address);
    await account.waitForDeployment();
    
    console.log(`   Smart account created at: ${account.target}`);
    console.log(`   Account owner: ${accountOwner.address}`);
    
    // Check if account was properly initialized
    const actualOwner = await account.owner();
    console.log(`   Actual owner in contract: ${actualOwner}\n`);

    // Fund paymaster
    console.log("💰 Funding paymaster...");
    const depositAmount = ethers.parseEther("1.0");
    await paymaster.connect(paymasterOwner).depositWithEvent({ value: depositAmount });
    console.log(`   Paymaster funded with ${ethers.formatEther(depositAmount)} ETH`);

    // Enable sponsorship for all accounts (for demo purposes)
    await paymaster.connect(paymasterOwner).sponsorAllAccounts();
    console.log("   Enabled sponsorship for all accounts\n");

    // Log initial balances
    console.log("📊 Initial Balances:");
    const smartAccountBalance = await ethers.provider.getBalance(account.target);
    const paymasterDeposit = await paymaster.getDeposit();
    console.log(`   Smart Account ETH Balance: ${ethers.formatEther(smartAccountBalance)} ETH`);
    console.log(`   Paymaster Deposit Balance: ${ethers.formatEther(paymasterDeposit)} ETH\n`);

    // Prepare sponsored transaction
    console.log("🎯 Preparing sponsored transaction...");
    const targetCallData = mockTarget.interface.encodeFunctionData("increment");
    
    // Get nonce
    const nonce = await entryPoint.getNonce(account.target, 0);
    
    // Create UserOperation
    let userOp = createUserOp(account, mockTarget.target, targetCallData, nonce);
    
    // Add paymaster data with gas limits
    const paymasterVerificationGasLimit = 100000;
    const paymasterPostOpGasLimit = 50000;
    userOp.paymasterAndData = ethers.solidityPacked(
        ["address", "uint128", "uint128"],
        [paymaster.target, paymasterVerificationGasLimit, paymasterPostOpGasLimit]
    );
    
    // Sign the UserOperation  
    const network = await ethers.provider.getNetwork();
    userOp.signature = await signUserOp(userOp, accountOwner, entryPoint.target, Number(network.chainId));
    
    console.log("   UserOperation created and signed");
    console.log(`   Target function: increment()`);
    console.log(`   Using paymaster: ${paymaster.target}\n`);

    // Execute sponsored transaction
    console.log("⚡ Executing sponsored transaction...");
    try {
        const tx = await entryPoint.handleOps([userOp], deployer.address);
        const receipt = await tx.wait();
        console.log(`   Transaction executed successfully!`);
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
    console.log(`   Counter value: ${counterValue.toString()}`);
    console.log(`   Last caller: ${lastCaller} (should be smart account address)\n`);

    // Log final balances
    console.log("📊 Final Balances:");
    const smartAccountBalanceAfter = await ethers.provider.getBalance(account.target);
    const paymasterDepositAfter = await paymaster.getDeposit();
    
    console.log(`   Smart Account ETH Balance: ${ethers.formatEther(smartAccountBalanceAfter)} ETH`);
    console.log(`   Paymaster Deposit Balance: ${ethers.formatEther(paymasterDepositAfter)} ETH\n`);

    // Show the sponsorship effect
    console.log("🎉 Sponsorship Summary:");
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
        console.error("❌ Demo failed:", error);
        process.exit(1);
    }); 