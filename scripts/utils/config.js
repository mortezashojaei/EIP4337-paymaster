require('dotenv').config();
const fs = require('fs');
const path = require('path');

class Config {
    constructor() {
        this.envPath = path.join(__dirname, '../../.env');
    }

    // Get environment variable with validation
    getRequired(key) {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Required environment variable ${key} is not set`);
        }
        return value;
    }

    // Get environment variable with default
    get(key, defaultValue = null) {
        return process.env[key] || defaultValue;
    }

    // Save address to .env file
    saveAddress(key, address) {
        if (!fs.existsSync(this.envPath)) {
            fs.writeFileSync(this.envPath, '');
        }

        let envContent = fs.readFileSync(this.envPath, 'utf8');
        const lines = envContent.split('\n');
        let found = false;

        // Update existing line or add new one
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith(`${key}=`)) {
                lines[i] = `${key}=${address}`;
                found = true;
                break;
            }
        }

        if (!found) {
            lines.push(`${key}=${address}`);
        }

        fs.writeFileSync(this.envPath, lines.join('\n'));
        process.env[key] = address; // Update current process env
    }

    // Get gas configuration
    getGasConfig() {
        return {
            verificationGasLimit: parseInt(this.get('VERIFICATION_GAS_LIMIT', '200000')),
            callGasLimit: parseInt(this.get('CALL_GAS_LIMIT', '200000')),
            maxPriorityFeePerGas: this.get('MAX_PRIORITY_FEE_PER_GAS', '1'),
            maxFeePerGas: this.get('MAX_FEE_PER_GAS', '10'),
            preVerificationGas: parseInt(this.get('PRE_VERIFICATION_GAS', '50000'))
        };
    }

    // Get contract addresses
    getAddresses() {
        return {
            entryPoint: this.get('ENTRY_POINT_ADDRESS'),
            accountFactory: this.get('ACCOUNT_FACTORY_ADDRESS'),
            sponsorPaymaster: this.get('SPONSOR_PAYMASTER_ADDRESS'),
            mockTarget: this.get('MOCK_TARGET_ADDRESS'),
            smartAccount: this.get('SMART_ACCOUNT_ADDRESS')
        };
    }
}

module.exports = new Config(); 