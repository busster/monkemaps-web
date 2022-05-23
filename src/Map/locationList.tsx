import React from 'react';
import { Link } from 'react-router-dom';

import './locationList.css';

import { Pin } from './machine';

type LocationListProps = {
  locations: Pin[];
  loading: boolean;
  activeLocation: Pin | undefined;
}

export const LocationList = ({ locations, loading, activeLocation }: LocationListProps): JSX.Element => {
  const isEmpty = locations.length === 0;

  if (loading) {
    return (
      <div className='Map-LocationList'>
        <div>Loading...</div>
      </div>
    );
  } else if (isEmpty) {
    return (
      <div className='Map-LocationList'>
        <div>No visible pins.</div>
      </div>
    );
  } else {
    return (
      <div className='Map-LocationList'>
        {
          locations.map(pin =>
            <div id={`Map-LocationList__item-${pin.id}`} key={pin.id} className={`Map-LocationList__item ${pin.id === activeLocation?.id ? 'Map-LocationList__item--active' : ''}`}>
              <Link className='Map-LocationList__item-link' to={`/map/${pin.id}`}>
                <div className='Map-LocationList__item-container'>
                  <div className='Map-LocationList__item-header'>{ pin.name }</div>
                  <div className='Map-LocationList__item-address'>{ pin.coordinates }</div>
                </div>
              </Link>
            </div>
          )
        }
      </div>
    );
  }
}
