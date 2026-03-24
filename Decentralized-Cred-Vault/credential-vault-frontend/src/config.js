// src/config.js
// Final Configuration for the Sepolia Deployment

// --- IMPORTANT: DEPLOYED CONTRACT ADDRESS ---
// This is your live contract address confirmed on Sepolia.
export const VAULT_ADDRESS = "0xef94DeE582eF3026A9C3194042c4bF8e2DF512e2"; 

// --- MINIMAL ABI for Required Functions ---
export const VAULT_ABI = [
    // 1. issueCredential (Write function, called by Issuer)
    {
        "inputs": [
            { "internalType": "address", "name": "_holder", "type": "address" },
            { "internalType": "bytes32", "name": "_documentHash", "type": "bytes32" }
        ],
        "name": "issueCredential",
        "outputs": [],
        "stateMutability": "nonpayable", // Changes state (requires gas)
        "type": "function"
    },
    // 2. verifyCredential (Read function, called by Public Verifier)
    {
        "inputs": [
            { "internalType": "address", "name": "_holder", "type": "address" },
            { "internalType": "bytes32", "name": "_documentHash", "type": "bytes32" }
        ],
        "name": "verifyCredential",
        "outputs": [
            { "internalType": "bool", "name": "isValid", "type": "bool" },
            { "internalType": "address", "name": "issuer", "type": "address" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view", // Read-only
        "type": "function"
    },
    // 3. hasRole (Read function, required for Access Control Check)
    {
        "inputs": [
            { "internalType": "bytes32", "name": "role", "type": "bytes32" },
            { "internalType": "address", "name": "account", "type": "address" }
        ],
        "name": "hasRole",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "view", // Read-only
        "type": "function"
    }
];