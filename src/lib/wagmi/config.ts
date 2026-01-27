'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, arbitrum, optimism, polygon, base } from 'wagmi/chains';

// WalletConnect Project ID - get yours at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    '[Wagmi] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.'
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: 'AstraDeFi',
  projectId: projectId || 'placeholder-project-id',
  chains: [mainnet, arbitrum, optimism, polygon, base],
  ssr: true, // Enable SSR for Next.js App Router
});

// Export chains for use in components
export const supportedChains = [mainnet, arbitrum, optimism, polygon, base] as const;
