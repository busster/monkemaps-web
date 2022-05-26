import React from 'react';

import { Link } from 'react-router-dom';

import './userInformation.css';

export const UserInformation = (): JSX.Element => {
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
        
      </div>
    </div>
  );
}
