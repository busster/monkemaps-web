import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { debounce, throttle } from 'lodash';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'

import { useActor } from '@xstate/react';

import { mapService, Pin } from './machine';

import './map.css'

import { Marker } from './marker';
import { LocationList } from './locationList';
import { send } from 'xstate/lib/actionTypes';

mapboxgl.accessToken = 'pk.eyJ1IjoiamFzb25idXNzIiwiYSI6ImNsMnhxcWM3bzB5Y28zYnBmZGtrenhiZmMifQ.iNeJnRHRkvoKl5TnZvy8gg';

const createMarkerClickHandler = (navigate: any, pin: any) => () => {
  navigate(`/map/${pin.id}`);
}

function intersectRect(r1: any, r2: any) {
  return !(r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top);
}

function getVisibleMarkers(map: any): string[] {
  var cc = map.getContainer();
  var els = cc.getElementsByClassName('mapboxgl-marker');
  var ccRect = cc.getBoundingClientRect();
  var visibles = [];
  for (var i = 0; i < els.length; i++) {
    var el = els.item(i);
    var elRect = el.getBoundingClientRect();
    intersectRect(ccRect, elRect) && visibles.push(el);
  }
  if (visibles.length > 0) {
    const map = {} as {
      [key in string]: string
    };
    visibles.forEach(v => map[v.id] = v.id);
    return Object.values(map);
  };
  return [];
}

// let findAndSetVisibleMarkers = () => {};

let handleSetLatLngZoom = () => {}
let handleSetVisibleMarkers = () => {}

const useMap = () => {
  const navigate = useNavigate();
  const map = useRef<null | mapboxgl.Map>(null);
  const container = useRef(null);

  const defLng = window.localStorage.getItem('map.lng');
  const defLat = window.localStorage.getItem('map.lat');
  const defZoom = window.localStorage.getItem('map.zoom');

  const [lng, setLng] = useState(defLng ? parseFloat(defLng) : -74.5);
  const [lat, setLat] = useState(defLat ? parseFloat(defLat) : 40);
  const [zoom, setZoom] = useState(defZoom ? parseFloat(defZoom) : 9);

  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [visibleMarkers, setVisibleMarkers] = useState<Pin[]>([]);
  const [hoveredMarker, setHoveredMarker] = useState<Pin>();

  const useLeave = (pin: Pin) => useCallback(() => {
    console.log(hoveredMarker)
    if (pin.id === hoveredMarker?.id) {
      setHoveredMarker(undefined)
    }
  }, [hoveredMarker])

  const [state] = useActor(mapService);
  // console.log(state.value)
  const send = mapService.send;

  handleSetLatLngZoom = () => {
    const mapbox = map.current;
    if (!mapbox) return;
    const newLng = mapbox.getCenter().lng;
    const newLat = mapbox.getCenter().lat;
    const newZoom = mapbox.getZoom();

    window.localStorage.setItem('map.lng', newLng.toFixed(4));
    window.localStorage.setItem('map.lat', newLat.toFixed(4));
    window.localStorage.setItem('map.zoom', newZoom.toFixed(4));

    setLng(mapbox.getCenter().lng);
    setLat(mapbox.getCenter().lat);
    setZoom(mapbox.getZoom());
  };
  handleSetVisibleMarkers = () => {
    const mapbox = map.current;
    if (!mapbox) return;
    const markers = getVisibleMarkers(mapbox);
    setVisibleMarkers(state.context.pins.filter((pin: any) => markers.includes(pin.id)))
  };

  useEffect(() => {
    if (!container.current) return;

    const mapbox = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom,
      attributionControl: false
    });

    mapbox.on('move', () => {
      handleSetLatLngZoom()
    });
    mapbox.on('moveend', () => {
      handleSetVisibleMarkers()
    });

    map.current = mapbox;

    send('REPOINT');
  }, [container]);

  useEffect(() => {
    if (!map.current) return;

    if (state.matches('display.none')) {
      send('RENDER');
    }

    if (
      ([
        'data.loaded',
        'display.map'
      ] as const).every((substate) => state.matches(substate))
    ) {
      const pins = state.context.pins;
      markers.forEach(marker => marker.remove());
      setMarkers([]);
      const newMarkers = pins.filter(pin => !pin.virtual).map(
        pin => new mapboxgl.Marker(
          Marker({
            pin,
            handleOnclick: createMarkerClickHandler(navigate, pin),
            handleOnmouseenter: () => {
              document.getElementById(`Map-LocationList__item-${pin.id}`)?.scrollIntoView({ behavior: 'smooth' });
              // setHoveredMarker(pin);
            },
            handleOnmouseleave: () => {},
          })
        ).setLngLat(pin.coordinates)
      )
      newMarkers.forEach(marker => marker.addTo(map.current as mapboxgl.Map))
      setMarkers(newMarkers);

      const visibleMarkers = getVisibleMarkers(map.current);
      setVisibleMarkers(state.context.pins.filter(pin => visibleMarkers.includes(pin.id)));

      send('POINT');
    }

    return () => {
      markers.forEach(marker => marker.remove());
    }
  }, [map, state.value]);

  return {
    container,
    map,
    lng, setLng,
    lat, setLat,
    zoom, setZoom,
    visibleMarkers,
    state,
    send,
    reload: () => {
      send('RELOAD');
    },
    hoveredMarker
  }
}

export const Map: React.FunctionComponent = (): JSX.Element => {
  const { container, visibleMarkers, state, reload, hoveredMarker } = useMap();
  const [listOpen, setListOpen] = useState(false);

  const virtualLocations = state.context.pins.filter(pin => pin.virtual);

  return (
    <div className='Map-Wrapper'>
      <button className='Map-Wrapper__list-expander' onClick={() => setListOpen(!listOpen)}>
        <img className='Map-Wrapper__list-expander-icon' src={ listOpen ? '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-59.svg' : '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-60.svg' } alt='MonkeDAO Map List Toggle Icon' />
        { listOpen ? 'View Map' : 'View List'}
      </button>
      <div className={`Map-Wrapper__list ${ listOpen ? 'Map-Wrapper__list--expanded' : '' }`}>
        <LocationList loading={state.matches('loading')} locations={visibleMarkers} virtualLocations={virtualLocations} activeLocation={hoveredMarker} />
      </div>
      <div className='Map-Wrapper__view'>
        <button className='Map-Wrapper__view-refresher' onClick={() => reload()}>
          <img className='Map-Wrapper__view-refresher-icon' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-78.svg' alt='MonkeDAO Map List Refresh Icon' />
          Refresh
        </button>
        <div className='Map' ref={container}></div>
      </div>
    </div>
  );
}
