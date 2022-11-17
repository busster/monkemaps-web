import React, { FC, useMemo, useState } from 'react';
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  GlowWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { HashRouter } from 'react-router-dom';

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';
import './components.css';

import { AppNavBar } from './AppNav/navbar';
import { AppRoutes } from './AppRoutes/routes';
import { ViewportProvider } from './utils/viewport';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Login } from './Login/auth';
import useToken from './Hooks/useToken';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Fonts } from './design/fonts/Font';

const theme = extendTheme({
  fonts: {
    heading: 'Space Grotesk',
    body: 'Space Grotesk',
  },
});

export const App = () => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network =
    (process.env.REACT_APP_SOLANA_ENV as WalletAdapterNetwork) ??
    WalletAdapterNetwork.Devnet;
  const rpc = 'https://monkervkmgtpm2tswbcdigjud2jif.xyz2.hyperplane.dev/';
  let networkUrl = rpc?.includes('https') ? rpc : clusterApiUrl(network);

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => networkUrl, [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new LedgerWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network],
  );
  const { token, setToken } = useToken();

  return (
    <ChakraProvider theme={theme}>
      <Fonts />
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
              <ToastContainer />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ViewportProvider>
    </ChakraProvider>
  );
};

export default App;
