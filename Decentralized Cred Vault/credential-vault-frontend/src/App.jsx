// src/App.jsx
// This code is built for a Wagmi v2 setup with Viem utilities.

import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VAULT_ADDRESS, VAULT_ABI } from './config';
import { keccak256, toBytes } from 'viem'; 

// --- 1. DEFINITIVE ON-CHAIN ROLE ID (The Fix) ---
// This value was confirmed via cast call to be the exact bytes32 hash 
// stored on the contract for the "ISSUER_ROLE".
const ISSUER_ROLE_ID = "0x114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa122"; 

// --- Component 1: Wallet Connection Status ---
function WalletStatus() {
    const { address, isConnected, isConnecting } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    if (isConnecting) return <div className="text-gray-500">Connecting...</div>;
    if (isConnected) return (
        <div className="text-green-600 font-medium flex items-center">
            Connected: <span className="ml-2 font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</span>
            <button className="ml-4 bg-red-500 text-white px-3 py-1 text-sm rounded-full hover:bg-red-600 transition" onClick={() => disconnect()}>Disconnect</button>
        </div>
    );

    return (
        <div>
            {connectors.map((connector) => (
                <button 
                    key={connector.uid} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    onClick={() => connect({ connector })}
                >
                    Connect {connector.name}
                </button>
            ))}
        </div>
    );
}

// --- Component 2: Institution Panel (Write Logic) ---
function IssueCredential() {
    const { address: userAddress, isConnected } = useAccount();
    const [holderAddress, setHolderAddress] = useState('');
    const [fileHash, setFileHash] = useState('');
    
    // --- Hook for Write Transaction ---
    const { writeContract, data: txHash } = useWriteContract();
    
    // --- Hook for Role Check (THE FIX) ---
    const { data: hasIssuerRole, isLoading: isLoadingRole } = useReadContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'hasRole', 
        args: [ISSUER_ROLE_ID, userAddress],
        enabled: isConnected && !!userAddress, // Only run when wallet is connected and address is available
        query: {
            // Force refetch when userAddress changes to ensure role is updated
            queryKey: ['hasIssuerRole', userAddress],
        }
    });
    
    // --- Hook to Wait for Confirmation ---
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
        hash: txHash, 
        enabled: !!txHash
    });

    // Client-side hashing function
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const buffer = toBytes(event.target.result); 
                const hash = keccak256(buffer);
                setFileHash(hash);
                // NOTE: In a real project, the document would be uploaded to IPFS here
            };
            reader.readAsArrayBuffer(file); 
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!hasIssuerRole) {
             alert("Access Denied: Your wallet is not an authorized ISSUER_ROLE. Please connect the correct institutional wallet.");
             return;
        }

        // Send the transaction
        writeContract({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'issueCredential',
            args: [holderAddress, fileHash],
        });
    };

    if (isLoadingRole) return <div className="p-4 bg-yellow-100 text-yellow-700">Checking Institution Authorization...</div>;
    
    // If the role check returns FALSE, show the denied message
    if (!hasIssuerRole) return (
        <div className="p-4 border border-red-500 bg-red-50 text-red-700 rounded-lg">
            **Access Denied:** Connected wallet is not a registered Institution Issuer.
        </div>
    );

    // Normal Issuer UI (Only shown if hasIssuerRole is true)
    return (
        <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded-xl shadow-lg bg-white">
            <h3 className="text-2xl font-bold mb-5 text-gray-800">1. Institution: Issue Credential</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Address (Holder):</label>
                <input 
                    type="text" 
                    value={holderAddress} 
                    onChange={(e) => setHolderAddress(e.target.value)} 
                    placeholder="0x..."
                    required 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Document:</label>
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    className="w-full text-gray-700"
                />
                <p className="text-xs break-all mt-2 text-gray-500">Hash (Proof of Document): <span className="font-mono">{fileHash || 'Waiting for file upload...'}</span></p>
            </div>
            
            <button 
                type="submit" 
                disabled={isConfirming || !fileHash || !holderAddress}
                className="bg-green-600 text-white p-3 rounded-lg w-full font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
                {isConfirming ? 'Awaiting Confirmation...' : 'Issue Credential (Pay Gas)'}
            </button>
            
            {txHash && <p className="mt-3 break-all text-sm text-gray-600">Tx Hash: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="text-blue-500 underline">{txHash.slice(0, 10)}...</a></p>}
            {isConfirmed && <p className="mt-3 text-green-700 font-bold">✅ Credential Issued Successfully! (Block confirmed)</p>}
        </form>
    );
}

// --- Component 3: Public Verifier Panel (Read Logic) ---
function VerifyCredential() {
    const [holderAddress, setHolderAddress] = useState('');
    const [documentHash, setDocumentHash] = useState('');

    const { data, isFetching, refetch } = useReadContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'verifyCredential',
        args: [holderAddress, documentHash],
        enabled: false, // Only trigger manually on form submit
        // Do NOT rely on userAddress, as this is a public function
    });
    
    const verificationResult = data ? { 
        isValid: data[0], 
        issuer: data[1], 
        timestamp: Number(data[2]) 
    } : null;

    const handleSubmit = (e) => {
        e.preventDefault();
        refetch(); // Manually trigger the read
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 border border-gray-300 rounded-xl shadow-lg bg-white">
            <h3 className="text-2xl font-bold mb-5 text-gray-800">2. Public: Verify Credential</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Address (Holder):</label>
                <input 
                    type="text" 
                    value={holderAddress} 
                    onChange={(e) => setHolderAddress(e.target.value)} 
                    placeholder="0x..."
                    required 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Hash (bytes32):</label>
                <input 
                    type="text" 
                    value={documentHash} 
                    onChange={(e) => setDocumentHash(e.target.value)} 
                    placeholder="0x..."
                    required 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <button 
                type="submit" 
                disabled={isFetching}
                className="bg-indigo-600 text-white p-3 rounded-lg w-full font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
                {isFetching ? 'Verifying...' : 'Verify on Blockchain'}
            </button>

            {verificationResult && (
                <div className="mt-5 p-4 border rounded-lg">
                    <p className={`font-bold text-xl ${verificationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                        Verification Status: {verificationResult.isValid ? '✅ VALID & AUTHENTIC' : '❌ INVALID/NOT FOUND'}
                    </p>
                    <hr className="my-2" />
                    <p className="text-sm text-gray-700">Issued By: {verificationResult.issuer === '0x0000000000000000000000000000000000000000' ? 'N/A' : verificationResult.issuer}</p>
                    <p className="text-sm text-gray-700">Issue Date: {verificationResult.timestamp > 0 ? new Date(Number(verificationResult.timestamp) * 1000).toLocaleDateString() : 'N/A'}</p>
                </div>
            )}
        </form>
    );
}

// --- Main App Layout ---
export default function App() {
    const { isConnected } = useAccount();

    return (
        <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Decentralized Student Credential Vault made By Raghav in 2021
                </h1>
                <WalletStatus />
            </header>
            
            <hr className="mb-8 border-gray-300" />

            {isConnected ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <IssueCredential />
                    <VerifyCredential />
                </div>
            ) : (
                <div className="text-center p-20 border-4 border-dashed border-gray-300 bg-gray-100 rounded-xl">
                    <p className="text-xl text-gray-600">
                        Please connect your MetaMask wallet to access the Institution Panel (Issuer) or the Public Verification tool.
                    </p>
                </div>
            )}
        </div>
    );
}