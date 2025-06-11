const { ethers } = require("hardhat");

// Helper function to create PackedUserOperation
function createUserOp(account, target, data, nonce = 0, gasConfig = {}) {
    const {
        verificationGasLimit = 200000,
        callGasLimit = 200000,
        maxPriorityFeePerGas = "1",
        maxFeePerGas = "10",
        preVerificationGas = 50000
    } = gasConfig;

    // Pack gas limits: [verificationGasLimit(128 bits)][callGasLimit(128 bits)]
    const accountGasLimits = ethers.solidityPacked(
        ["uint128", "uint128"], 
        [verificationGasLimit, callGasLimit]
    );
    
    // Pack gas fees: [maxPriorityFeePerGas(128 bits)][maxFeePerGas(128 bits)]
    const maxPriorityFee = ethers.parseUnits(maxPriorityFeePerGas.toString(), "gwei");
    const maxFee = ethers.parseUnits(maxFeePerGas.toString(), "gwei");
    const gasFees = ethers.solidityPacked(
        ["uint128", "uint128"], 
        [maxPriorityFee, maxFee]
    );

    return {
        sender: account.target,
        nonce: nonce,
        initCode: "0x",
        callData: account.interface.encodeFunctionData("execute", [target, 0, data]),
        accountGasLimits: accountGasLimits,
        preVerificationGas: preVerificationGas,
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

module.exports = {
    createUserOp,
    signUserOp
}; 