import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import { Link } from 'react-router-dom';

import './userInformation.css';
import { useWallet } from '@solana/wallet-adapter-react';

const latValid = (n: number) => n > -90 && n < 90;
const lngValid = (n: number) => n > -180 && n < 180;

export const UserInformation = (): JSX.Element => {
  const { publicKey } = useWallet();

  console.log(publicKey?.toString());

  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  const handleSetLat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value);
    setLat(n);
  }

  const handleSetLng = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value);
    setLng(n);
  }

  const saveDisabled = !publicKey || !latValid(lat) || !lngValid(lng);

  const handleSaveLocation = () => {
    
  }

  return (
    <div className='Profile__container'>
      <div className='Profile__header'>
        <Link className='Profile__back-link' to='/map'>
          <button className='Profile__back' onClick={() => {}}>
            <img className='Profile__back-icon' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg' alt='MonkeDAO Profile Back Icon' />
            Back
          </button>
        </Link>
      </div>
      <div className='Profile__body-container'>
        { publicKey && (
          <div className='Profile__wallet'>
            <h2 className='Profile__title'>Wallet</h2>
            <WalletMultiButton />
          </div>
        ) }

        <div className='Profile__location-container'>
          <h2 className='Profile__title'>Location</h2>
          <div className='Profile__location'>
            <label className='Profile__location-coord-label' htmlFor='lat'>Lat:</label>
            <input
              id="lat"
              className={`Profile__location-coord-input ${ !latValid(lat) ? 'Profile__location-coord-input--error' : '' }`}
              type='number'
              onChange={handleSetLat}
            ></input>
            <label className='Profile__location-coord-label' htmlFor='lng'>Lng:</label>
            <input
              id="lng"
              className={`Profile__location-coord-input ${ !lngValid(lng) ? 'Profile__location-coord-input--error' : '' }`}
              type='number'
              onChange={handleSetLng}
            ></input>
            <div className='Profile__location-actions'>
              <button className='Profile__save' onClick={handleSaveLocation} disabled={saveDisabled}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
