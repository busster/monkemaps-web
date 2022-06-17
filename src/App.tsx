import React, { FC, useMemo } from 'react';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import {
  HashRouter,
} from "react-router-dom";

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';
import './components.css';

import { AppNavBar } from './AppNav/navbar';
import { AppRoutes } from './AppRoutes/routes';
import { ViewportProvider } from './utils/viewport';

export const App = () => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = process.env.REACT_APP_SOLANA_ENV as WalletAdapterNetwork ?? WalletAdapterNetwork.Devnet;
  const rpc = process.env.REACT_APP_SOLANA_RPC;
  let networkUrl = rpc?.includes('https') ? rpc : clusterApiUrl(network);
  
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => networkUrl, [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  return (
    <ViewportProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <HashRouter>
              <div>
                <AppNavBar />
                <AppRoutes />
              </div>
            </HashRouter>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ViewportProvider>
  );
}

export default App;
