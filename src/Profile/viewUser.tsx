import React, { useEffect, useMemo, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';
import { Link, Navigate, useParams } from 'react-router-dom';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { useMachine } from '@xstate/react';
import { createUserMachine } from './machine';

import './userInformation.css';
import './viewUser.css';
import { NftData, MetaData } from '../Models/nft';
import axios from 'axios';
import { chunkItems } from '../utils/promises';
import { MDInput, MDDropdownSearch } from '../design';
import { CONSTANTS } from '../constants';

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
    <div className='Profile__view-container'>
      <div className='Profile__header'>
        <Link className='Profile__back-link' to='/map'>
          <button className='Profile__back button' onClick={() => { }}>
            <img className='Profile__back-icon' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg' alt='MonkeDAO Profile Back Icon' />
            Back
          </button>
        </Link>
      </div>
      {!state.matches('loading') && (
        <div className='Profile__view-body-container'>
          <div className='Profile__view-section'>
            <div
              className='Profile__view-nft'
            >
              <img
                className='nft_gallery_img'
                src={nft.imageUri}
              ></img>
            </div>

            <div className='Profile__view-name'>{ nickName }</div>

            <div className='Profile__view-location'>
              <img
                className='Profile__view-text-icon Profile__view-location-icon'
                src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-59.svg'
              ></img>
              <div className='Profile__view-text-value Profile__view-location-text'>{ location.text }</div>
            </div> 

            <div className='Profile__view-socials'>
              { twitter && <a href={`https://twitter.com/${twitter}`} target="_blank" className='Profile__view-text'>
                <img
                  className='Profile__view-text-icon'
                  src='/socials/twitter.png'
                ></img>
                <div className='Profile__view-text-value'>{ twitter }</div>
              </a>}

              { github && <a href={`https://github.com/${github}`} target="_blank" className='Profile__view-text'>
                <img
                  className='Profile__view-text-icon'
                  src='/socials/github.png'
                ></img>
                <div className='Profile__view-text-value'>{ github }</div>
              </a>}

              { discord && <div className='Profile__view-text'>
                <img
                  className='Profile__view-text-icon'
                  src='/socials/discord.png'
                ></img>
                <div className='Profile__view-text-value'>{ discord }</div>
              </div>}

              { telegram && <div className='Profile__view-text'>
                <img
                  className='Profile__view-text-icon'
                  src='/socials/telegram.png'
                ></img>
                <div className='Profile__view-text-value'>{ telegram }</div>
              </div>}
            </div>
          </div>
        </div>
      )}

{/* <div>Icons made by <a href="https://www.flaticon.com/authors/pixel-perfect" title="Pixel perfect">Pixel perfect</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/md-tanvirul-haque" title="Md Tanvirul Haque">Md Tanvirul Haque</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div> */}
    </div>
  );
}
