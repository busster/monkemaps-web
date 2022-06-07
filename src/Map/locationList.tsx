import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import './locationList.css';

import { Pin } from './machine';

type LocationListProps = {
  locations: Pin[];
  virtualLocations: Pin[];
  loading: boolean;
  activeLocation: Pin | undefined;
}

type ListView = 'Virtual' | 'Physical';

export const LocationList = ({ locations, virtualLocations, loading, activeLocation }: LocationListProps): JSX.Element => {
  const isEmpty = locations.length === 0 && virtualLocations.length === 0;

  const [view, setView] = useState<ListView>('Physical');

  if (loading) {
    return (
      <div className='Map-LocationList'>
        <div>Loading...</div>
      </div>
    );
  } else {
    return (
      <div className='Map-LocationList'>
        <div className='Map-LocationList__tabs'>
          <div className={`Map-LocationList__tab ${view === 'Physical' ? 'Map-LocationList__tab--active' : ''}`} onClick={() => setView('Physical')}>Physical</div>
          <div className={`Map-LocationList__tab ${view === 'Virtual' ? 'Map-LocationList__tab--active' : ''}`} onClick={() => setView('Virtual')}>Virtual</div>
        </div>
        <div className='Map-LocationList__list'>
          {
            view === 'Physical' ?
              (
                locations.length === 0 ?
                  (
                    <div className='Map-LocationList__empty'>
                      <div>No visible pins.</div>
                    </div>
                  ) :
                  (
                    locations.map(pin =>
                      <div id={`Map-LocationList__item-${pin.id}`} key={pin.id} className={`Map-LocationList__item ${pin.id === activeLocation?.id ? 'Map-LocationList__item--active' : ''}`}>
                        <Link className='Map-LocationList__item-link' to={`/map/${pin.id}`}>
                          <div className='Map-LocationList__item-container'>
                            <div className='Map-LocationList__item-header'>{ pin.name }</div>
                            <div className='Map-LocationList__item-address'>{ pin.text }</div>
                            <div className='Map-LocationList__item-date'>{ pin.startDate.toFormat('ccc, LLL LL, yyyy, hh:mm a') }</div>
                          </div>
                        </Link>
                      </div>
                    )
                  )
              ) :
              (
                virtualLocations.length === 0 ?
                  (
                    <div className='Map-LocationList__empty'>
                      <div>No virtual events.</div>
                    </div>
                  ) :
                  (
                    virtualLocations.map(pin =>
                      <div id={`Map-LocationList__item-${pin.id}`} key={pin.id} className={`Map-LocationList__item ${pin.id === activeLocation?.id ? 'Map-LocationList__item--active' : ''}`}>
                        <Link className='Map-LocationList__item-link' to={`/map/${pin.id}`}>
                          <div className='Map-LocationList__item-container'>
                            <div className='Map-LocationList__item-header'>{ pin.name }</div>
                            <div className='Map-LocationList__item-address'>{ pin.text }</div>
                            <div className='Map-LocationList__item-date'>{ pin.startDate.toFormat('ccc, LLL LL, yyyy, hh:mm a') }</div>
                          </div>
                        </Link>
                      </div>
                    )
                  )
              )
          }
        </div>
      </div>
    );
  }
}
