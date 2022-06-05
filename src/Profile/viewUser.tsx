import React, { useEffect, useMemo, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { useMachine } from '@xstate/react';
import { createUserMachine } from './machine';

import './userInformation.css';
import { NftData, MetaData } from '../Models/nft';
import axios from 'axios';
import { chunkItems } from '../utils/promises';
import { MDInput, MDDropdownSearch } from '../design';
import { CONSTANTS } from '../constants';

const lookupPlaces = async (searchTerm: string) => {
  const response = await fetch(`${CONSTANTS.MAPBOX_PLACES_API}/${searchTerm}.json?access_token=${CONSTANTS.MAPBOX_ACCESS_TOKEN}`, {
    method: 'GET',
  });
  
  const res = await response.json();
  const results = res.features.map((f: any) => ({
    id: f.id,
    text: f.place_name,
    coordinates: f.geometry.coordinates.reverse()
}))
  if (response.ok) {
    return results;
  } else {
    return Promise.reject({ status: response.status });
  }
}

export const ViewUserInformation = (): JSX.Element => {
  const { monkeId } = useParams();
  const walletId = monkeId;

  const [state, send] = useMachine(() =>
    createUserMachine(walletId)
  );

  // const state = {matches: (s: any) => Boolean, value: '', context: {lat: 0, lng: 0}};
  // const send = (s: string, a?: any) => {}

  const {
    nickName,
    twitter,
    github,
    telegram,
    discord,
    nft,
    location,
  } = state.context;

  return (
    <div className='Profile__container'>
      <div className='Profile__header'>
        <Link className='Profile__back-link' to='/map'>
          <button className='Profile__back button' onClick={() => { }}>
            <img className='Profile__back-icon' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg' alt='MonkeDAO Profile Back Icon' />
            Back
          </button>
        </Link>
      </div>
      {!state.matches('loading') && (
        <div className='Profile__body-container'>

          <div className='Profile__section'>
            <h2 className='Profile__title'>User Information</h2>
            <div className='Profile__form'>
              <MDInput
                label='Nick Name'
                defaultValue={nickName}
                readonly
              />
              <MDDropdownSearch
                label='Location'
                placeholder='Search by address...'
                onSearch={lookupPlaces}
                onSelect={(v) => send('INPUT_LOCATION', { location: v })}
                selectedValue={location}
                selectId={v => v.id}
                mapTextValue={(val) => val ? val.text : ''}
                readonly
              />
              <MDInput
                label='Twitter'
                defaultValue={twitter}
                readonly
              />
              <MDInput
                label='Github'
                defaultValue={github}
                readonly
              />
              <MDInput
                label='Discord'
                defaultValue={discord}
                readonly
              />
              <MDInput
                label='Telegram'
                defaultValue={telegram}
                readonly
              />
            </div>
          </div>

          <div className='Profile__section'>
            <div className='Profile__gallery-container'>
              <h2 className='Profile__title'>Monkes</h2>
              <div className='Profile__gallery'>
                  <div
                    className='nft_gallery nft_gallery--selected nft_gallery--disabled'
                  >
                    <img
                      className='nft_gallery_img'
                      src={nft.imageUri}
                    ></img>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
