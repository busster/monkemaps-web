import React, { FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

import './App.css';

import { MapWrapper, Map, LocationDetails } from './Map';
import { ConnectWallet } from './ConnectWallet';
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');
import { UserInformation } from './Profile';


export const App = () => {
  const user = true;
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

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
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <div>
              <nav className='App__nav'>
                <div className='App__nav-logo-container'>
                  <Link to="/map">
                    <img className='App__nav-logo' src='/MonkeDAO_FullLogo_Dk+MidGreen_RGB.png' alt='MonkeDAO Logo' />
                  </Link>
                </div>
                <div className='App__nav-links'>
                  {
                    user
                      ? (
                        <Link className='App__nav-link' to="/profile">
                          <img className='App__nav-link-logo' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-67.svg' alt='MonkeDAO Crypto Logo' />
                          Profile
                        </Link>
                      )
                      : (
                        // <Link className='App__nav-link' to="/connect-wallet">
                        //   <img className='App__nav-link-logo' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-66.svg' alt='MonkeDAO Crypto Logo' />
                        //   Connect Wallet
                        // </Link>
                        <WalletMultiButton />
                      )
                  }
                </div>
              </nav>

              <Routes>
                {/* <Route path="/connect-wallet" element={<ConnectWallet />} /> */}
                <Route path="/profile" element={<UserInformation />} />
                <Route path="/map" element={<MapWrapper />}>
                  <Route path="" element={<Map />} />
                  <Route path=":locationId" element={<LocationDetails />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
