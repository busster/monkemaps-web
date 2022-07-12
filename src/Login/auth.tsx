import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js'
import { toast } from 'react-toastify'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { NftData, MetaData } from '../Models/nft'
import axios from 'axios'
import { chunkItems } from '../utils/promises'
import { MDInput, MDDropdownSearch, MDCheckbox } from '../design'
import { CONSTANTS } from '../constants'
import { connect } from 'http2'
import { clearToken } from '../utils/tokenUtils';
import './auth.css'

const bs58 = require('bs58')

export type LoginProps = {
  setToken: (token: any) => any
}

export const Login = (props: LoginProps): JSX.Element => {
  const {setToken } = props;
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    connect,
    signMessage,
    signTransaction,
  } = useWallet()

  wallet?.adapter?.addListener('disconnect', () => { 
    clearToken();
  });

  const { connection } = useConnection()
  const [isHardwareWallet, setIsHardwareWallet] = useState(false)
  const walletId = publicKey?.toBase58() ?? ''
  const verify = useCallback(async () => {
    if(!connected) {
      await connect();
    }
    try {
      toast.info('Logging you in...', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 2500,
      })
      const message = `Sign this message for authenticating with your wallet. Nonce: ${walletId}`
      const conn = connection as Connection
      if (isHardwareWallet) {
        if (!signTransaction) {
          toast.error('Wallet does not support signing transactions.', {
            position: toast.POSITION.TOP_CENTER,
          })
          return Promise.reject()
        }
        //hardcode for now
        const response = await fetch(`http://localhost:4000/monkemaps/auth/txn`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletId, message: btoa(message) }),
        })

        const res = await response.json()
        const latestBlockHash = await conn.getLatestBlockhash()
        const walletPk = new PublicKey(walletId)
        const transaction = new Transaction()
        transaction.feePayer = walletPk
        transaction.recentBlockhash = latestBlockHash.blockhash
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: walletPk,
            toPubkey: new PublicKey(res.destination),
            lamports: res.lamports,
          }),
        )
        const signedTxn = await signTransaction(transaction)
        const txnSerialized = signedTxn.serialize()
        const signature = await conn.sendRawTransaction(txnSerialized, {
          skipPreflight: true,
        })
        await conn.confirmTransaction(
          {
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature,
          },
          'confirmed',
        )
        setToken({token: res, hw: 'true', txn: signature});
      } else {
        const encodedMessage = new TextEncoder().encode(message)
        if (!walletId) throw new Error('Wallet not connected!')
        if (!signMessage)
          throw new Error('Wallet does not support message signing!')
        const signedMessage = await signMessage(encodedMessage)
        const signedAndEncodedMessage = bs58.encode(signedMessage)
        const response = await fetch(`http://localhost:4000/monkemaps/auth/sign`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletId, message: btoa(message), signedMsg: signedAndEncodedMessage }),
        });
        const tkn = await response.json();
        setToken({token: tkn.token, hw: ''});
      }
    } catch (err: any) {
      console.log('ERROR >>>', err, err?.message)
      toast.error('Failed to login.', {
        position: toast.POSITION.TOP_CENTER,
      })
      return Promise.reject(err)
    }
  }, [publicKey, isHardwareWallet])

  return (
    <div>
    <div className="Profile__view-container">
    <div className="Profile__view-body-container">
      <div className="Profile__header">
        <h2>Authenticate your Monke Wallet</h2>
        <div className="Profile__view-section">
          <h3 className="Profile__title">Using Hardware Wallet?</h3>
          <div className="Profile__hardware-switch">
            <MDCheckbox
              checked={isHardwareWallet}
              setChecked={setIsHardwareWallet}
            />
          </div>
        </div>
          <button className="Profile__back button" onClick={verify} disabled={!connected && !publicKey}>
            <img
              className="Profile__back-icon"
              src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg"
              alt="MonkeDAO Profile Back Icon"
            />
            Authenticate
          </button>
        
         <WalletMultiButton />
      </div>
    </div>
    </div>
    </div>
  )
}
