// src/wagmi.jsx

import { WagmiConfig, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Setup TanStack Query for state management
const queryClient = new QueryClient();

// 2. Create the Wagmi Config Client (V2 Standard)
export const config = createConfig({
  // Use V2 connectors (MetaMask is now directly imported)
  connectors: [
    metaMask(),
  ],
  
  // Define chains and their transport method
  chains: [sepolia],
  
  // Configure transports (how the app talks to the blockchain)
  transports: {
    [sepolia.id]: http(), // Use Alchemy's HTTP transport for Sepolia
  },

  autoConnect: true,
});

// 3. Provider Wrapper Component
export function WagmiWrapper({ children }) {
  return (
    // QueryClientProvider is wrapped around WagmiConfig
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  );
}

// NOTE: You must use this WagmiWrapper to wrap your <App /> component in your main.jsx/main.tsx file.