import React, { FC, useEffect, useMemo } from 'react'
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
  useConnection,
} from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

import '@solana/wallet-adapter-react-ui/styles.css'
import '../App.css'
import { useActor } from '@xstate/react'
import { UserMachine } from '../Profile/machine'
import { getToken } from '../utils/tokenUtils'

export const AppNavBar = () => {
  const wallet = useWallet()
  const { connection } = useConnection()
  const token = getToken()
  const { publicKey } = wallet

  useEffect(() => {
    if (!publicKey) {
      const service = UserMachine.get({})
      service.send('DISCONNECT')
      return
    }

    const service = UserMachine.get({ wallet })
    service.send('CONNECT', { wallet, connection })
  }, [publicKey, connection])

  return (
    <nav className="App__nav">
      <div className="App__nav-logo-container">
        <Link to="/map">
          <img
            className="App__nav-logo"
            src="/MonkeDAO_FullLogo_Dk+MidGreen_RGB.png"
            alt="MonkeDAO Logo"
          />
        </Link>
      </div>
      <div className="App__nav-links">
        {publicKey ? (
          <Link className="App__nav-link" to="/profile">
            <img
              className="App__nav-link-logo"
              src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-67.svg"
              alt="MonkeDAO Crypto Logo"
            />
            Profile
          </Link>
        ) : (
          <WalletMultiButton />
        )}
      </div>
    </nav>
  )
}
