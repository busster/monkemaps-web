import React, { useEffect, useMemo, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';
import { Link, Navigate } from 'react-router-dom';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { useMachine } from '@xstate/react';
import { createUserMachine, latValid, lngValid } from './machine';

import './userInformation.css';
import { NftData, MetaData } from '../Models/nft';
import axios from 'axios';
import { chunkItems } from '../utils/promises';

export const UserInformation = (): JSX.Element => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [nftArray, setNftArray] = useState<NftData[]>([]);
  const walletId = publicKey?.toBase58();

  console.log(nftArray)

  const [state, send] = useMachine(() =>
    createUserMachine(walletId)
  );
  useEffect(() => {
    let active = true
    load()
    return () => { active = false }

    async function load() {
      setNftArray([])
      let nftResult: NftData[] = [];
      if (walletId) {
        nftResult = await getParsedNftAccountsByOwner({
          publicAddress: walletId,
          connection
        });
        nftResult = nftResult.filter(x => x.updateAuthority == process.env.REACT_APP_NFT_UA);
        const nftChunks = chunkItems(nftResult);
        for (const chunk of nftChunks) {
          await Promise.all(
            chunk.map(async (item, index) => {
              const result = await axios.get<MetaData>(item.data.uri);
              item.imageUri = result.data.image;
            }));
        }
      }
      if (!active) { return }
      setNftArray(nftResult)
    }
  }, [walletId]);

  // const state = {matches: (s: any) => Boolean, value: '', context: {lat: 0, lng: 0}};
  // const send = (s: string, a?: any) => {}

  useEffect(() => {
    if (!walletId) {
      send('DISCONNECT');
    }
  }, [walletId]);

  const { lat, lng } = state.context;

  const handleSetLat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (isNaN(parsed)) return;
    send('INPUT_LAT', { lat: parsed });
  }

  const handleSetLng = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (isNaN(parsed)) return;
    send('INPUT_LNG', { lng: parsed });
  }

  if (state.matches('none')) {
    return <Navigate to='/map'></Navigate>
  } else {
    return (
      <div className='Profile__container'>
        <div className='Profile__header'>
          <Link className='Profile__back-link' to='/map'>
            <button className='Profile__back button' onClick={() => { }}>
              <img className='Profile__back-icon' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg' alt='MonkeDAO Profile Back Icon' />
              Back
            </button>
          </Link>
          <div className='Profile__actions'>
            {
              ['edit'].some(state.matches) && (
                <button
                  className='Profile__save button button'
                  onClick={() => send('RESET')}
                >Cancel</button>
              )
            }
            {
              ['edit', 'create'].some(state.matches) && (
                <button
                  className='Profile__save button button--save'
                  onClick={() => send('SAVE')}
                  disabled={['edit.invalid', 'create.invalid'].some(state.matches)}
                >Save</button>
              )
            }
          </div>
        </div>
        <div className='Profile__body-container'>
          <div className='Profile__wallet'>
            <h2 className='Profile__title'>Wallet</h2>
            <WalletMultiButton />
          </div>
          {!state.matches('loading') && (
            <div className='Profile__location-container'>
              <h2 className='Profile__title'>Location</h2>
              <div className='Profile__location'>
                <label className='Profile__location-coord-label' htmlFor='lat'>Lat:</label>
                <input
                  id="lat"
                  className={`Profile__location-coord-input ${!latValid(lat) ? 'Profile__location-coord-input--error' : ''}`}
                  type='number'
                  defaultValue={lat}
                  onChange={handleSetLat}
                ></input>
                <label className='Profile__location-coord-label' htmlFor='lng'>Lng:</label>
                <input
                  id="lng"
                  className={`Profile__location-coord-input ${!lngValid(lng) ? 'Profile__location-coord-input--error' : ''}`}
                  type='number'
                  defaultValue={lng}
                  onChange={handleSetLng}
                ></input>
              </div>
            </div>
          )
          }
          {state.matches('display') && (
            <button
              className='Profile__delete button button--delete'
              onClick={() => send('DELETE')}
            >Delete User</button>
          )
          }
        </div>
      </div>
    );
  }
}
