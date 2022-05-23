import React from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useActor } from '@xstate/react';

import './locationDetails.css'

import { mapService } from './machine';

const useLocationDetails = () => {
  const navigate = useNavigate();

  const [state] = useActor(mapService);

  const a = useLocation();
  const idMatch = a.pathname.match(/\/map\/(.*)/);
  const id = idMatch && idMatch.length > 1 && idMatch[1];

  const location = state.context.pins.find(pin => pin.id === id);

  if (!location) {
    navigate('/map');
  }

  return location
}

export const LocationDetails: React.FunctionComponent = (): JSX.Element => {

  const location = useLocationDetails();

  return (
    <div className='Map-Location-Details__container'>
      <div className='Map-Location-Details__header'>
        <Link className='Map-Location-Details__back-link' to='/map'>
          <button className='Map-Location-Details__back' onClick={() => {}}>
            <img className='Map-Location-Details__back-icon' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-89.svg' alt='MonkeDAO Map Location Details Back Icon' />
            Back
          </button>
        </Link>
      </div>
      <div className='Map-Location-Details__body-container'>
        <h1 className='Map-Location-Details__title'>{ location?.name }</h1>
      </div>
    </div>
  );
}
