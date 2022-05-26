import React, { FC, useMemo } from 'react';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
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

import '@solana/wallet-adapter-react-ui/styles.css';
import '../App.css';


export const AppNavBar = () => {
  const { publicKey } = useWallet();

  return (
    <nav className='App__nav'>
      <div className='App__nav-logo-container'>
        <Link to="/map">
          <img className='App__nav-logo' src='/MonkeDAO_FullLogo_Dk+MidGreen_RGB.png' alt='MonkeDAO Logo' />
        </Link>
      </div>
      <div className='App__nav-links'>
        {
          publicKey
            ? (
              <Link className='App__nav-link' to="/profile">
                <img className='App__nav-link-logo' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-67.svg' alt='MonkeDAO Crypto Logo' />
                Profile
              </Link>
            )
            : (
              <WalletMultiButton />
            )
        }
      </div>
    </nav>
  );
}
