import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl-csp';
// eslint-disable-next-line import/no-webpack-loader-syntax
import MapboxWorker from 'worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker'; // Load worker code separately with worker-loader

import 'mapbox-gl/dist/mapbox-gl.css';

import { useActor } from '@xstate/react';

import { mapService } from './machine';

import './map.css';

import { ClusterMarker, Marker, UserMarker } from './marker';
import { LocationList } from './locationList';

import { Rendered, Supercluster } from './supercluster';
import { toast } from 'react-toastify';
import { CONSTANTS } from '../constants';
mapboxgl.workerClass = MapboxWorker; // Wire up loaded worker to be used instead of the default

mapboxgl.accessToken = CONSTANTS.MAPBOX_ACCESS_TOKEN;

const createMarkerClickHandler = (navigate, pin) => () => {
  navigate(`/map/${pin.id}`);
};

const createUserMarkerClickHandler = (navigate, user) => () => {
  navigate(`/monke/${user.id}`);
};

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function getVisibleMarkers(map) {
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
    const map = {};
    visibles.forEach((v) => (map[v.id] = v.id));
    return Object.values(map);
  }
  return [];
}

let updateMarkers = () => {};
let handleSetLatLngZoom = () => {};
let handleSetVisibleMarkers = () => {};

const useMap = () => {
  const navigate = useNavigate();
  const map = useRef(null);
  const container = useRef(null);

  const defLng = window.localStorage.getItem('map.lng');
  const defLat = window.localStorage.getItem('map.lat');
  const defZoom = window.localStorage.getItem('map.zoom');

  const [lng, setLng] = useState(defLng ? parseFloat(defLng) : -74.5);
  const [lat, setLat] = useState(defLat ? parseFloat(defLat) : 40);
  const [zoom, setZoom] = useState(defZoom ? parseFloat(defZoom) : 9);

  // const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const [hoveredMarker, setHoveredMarker] = useState();

  const [clusterizer, setClusterizer] = useState(
    new Supercluster({
      radius: 20,
    }),
  );

  const [allPins, setAllPins] = useState({});

  updateMarkers = () => {
    Rendered.get().forEach((p) => p.remove());
    const newRenderedPins = [];

    const mapbox = map.current;
    const bounds = mapbox.getBounds();
    const southwest = bounds.getSouthWest();
    const northeast = bounds.getNorthEast();
    const bbox = [southwest.lng, southwest.lat, northeast.lng, northeast.lat];
    const clusters = clusterizer.getClusters(bbox, mapbox.getZoom());

    clusters.forEach((feature) => {
      const coords = feature.geometry.coordinates;
      const props = feature.properties;

      if (props.cluster) {
        const id = props.cluster_id;
        const marker = new mapboxgl.Marker(
          ClusterMarker({
            cluster: props,
            handleOnclick: () => {
              const zoom = clusterizer.getClusterExpansionZoom(id);
              map.current.easeTo({
                center: coords,
                zoom,
              });
            },
          }),
        ).setLngLat(coords);
        newRenderedPins.push(marker);
      } else {
        const id = props.id;

        if (props.markerType === 'Pin') {
          const pin = allPins[props.id];
          const marker = new mapboxgl.Marker(
            Marker({
              pin: pin,
              handleOnclick: createMarkerClickHandler(navigate, props),
              handleOnmouseenter: () => {
                document
                  .getElementById(`Map-LocationList__item-${props.id}`)
                  ?.scrollIntoView({ behavior: 'smooth' });
              },
              handleOnmouseleave: () => {},
            }),
          ).setLngLat(coords);
          newRenderedPins.push(marker);
        } else {
          const user = allPins[props.id];
          const marker = new mapboxgl.Marker(
            UserMarker({
              user: user,
              handleOnclick: createUserMarkerClickHandler(navigate, props),
              handleOnmouseenter: () => {},
              handleOnmouseleave: () => {},
            }),
          ).setLngLat(coords);
          newRenderedPins.push(marker);
        }
      }
    });

    newRenderedPins.forEach((p) => p.addTo(map.current));
    Rendered.set(newRenderedPins);
  };

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

    const bounds = mapbox.getBounds();
    const southwest = bounds.getSouthWest();
    const northeast = bounds.getNorthEast();
    const bbox = [southwest.lng, southwest.lat, northeast.lng, northeast.lat];
    const clusters = clusterizer.getClusters(bbox, mapbox.getZoom());

    const markerIdsInBounds = [];

    clusters.forEach((feature) => {
      const props = feature.properties;
      if (props.cluster) {
        const id = props.cluster_id;
        const points = clusterizer.getLeaves(id, Infinity);
        points.forEach((p) => {
          markerIdsInBounds.push(p.properties.id);
        });
      } else {
        const id = props.id;
        const markerType = props.markerType;
        if (markerType === 'Pin') {
          markerIdsInBounds.push(id);
        }
      }
    });

    // const visibleMarkers = getVisibleMarkers(mapbox);
    setVisibleMarkers(
      state.context.pins.filter((pin) => markerIdsInBounds.includes(pin.id)),
    );
  };
  const moveFunc = () => {
    handleSetLatLngZoom();
  };
  const moveEndFunc = () => {
    handleSetVisibleMarkers();
    updateMarkers();
  };

  useEffect(() => {
    if (!container.current) return;

    const mapbox = new mapboxgl.Map({
      container: container.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom,
      attributionControl: false,
    });

    mapbox.on('move', moveFunc);
    mapbox.on('moveend', moveEndFunc);

    map.current = mapbox;

    send('REPOINT');

    return () => {
      const mapbox = map.current;

      mapbox.off('move', moveFunc);
      mapbox.off('moveend', moveEndFunc);

      Rendered.get().forEach((p) => p.remove());
      Rendered.set([]);
    };
  }, [container]);

  useEffect(() => {
    if (!map.current) return;

    if (state.matches('display.none')) {
      send('RENDER');
    }

    if (
      ['data.loaded', 'display.map'].every((substate) =>
        state.matches(substate),
      )
    ) {
      const allPinsArr = [
        ...state.context.pins.filter((pin) => !pin.virtual),
        ...state.context.users.filter((u) => u.showLocation),
      ];
      const newAllPinsObj = allPinsArr.reduce((acc, n) => {
        acc[n.id] = n;
        return acc;
      }, allPins);
      setAllPins(newAllPinsObj);

      clusterizer.load(
        allPinsArr.map((p) => ({
          type: 'Feature',
          properties: {
            id: p.id,
            markerType: p.markerType,
          },
          geometry: {
            type: 'Point',
            coordinates: p.coordinates,
          },
        })),
      );

      setClusterizer(clusterizer);

      updateMarkers();
      handleSetVisibleMarkers();

      send('POINT');
    }
  }, [map, state.value]);

  return {
    container,
    map,
    lng,
    setLng,
    lat,
    setLat,
    zoom,
    setZoom,
    visibleMarkers,
    state,
    send,
    reload: () => {
      toast.info('Refreshing map...', {
        position: toast.POSITION.BOTTOM_CENTER,
      });
      send('RELOAD');
    },
    rerender: () => {
      send('RERENDER');
    },
    hoveredMarker,
  };
};

export const Map = () => {
  const {
    container,
    visibleMarkers,
    state,
    reload,
    rerender,
    hoveredMarker,
    map,
  } = useMap();
  const [listOpen, setListOpen] = useState(false);

  const virtualLocations = state.context.pins.filter((pin) => pin.virtual);

  return (
    <div className="Map-Wrapper">
      <button
        className="Map-Wrapper__list-expander"
        onClick={() => setListOpen(!listOpen)}
      >
        <img
          className="Map-Wrapper__list-expander-icon"
          src={
            listOpen
              ? '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-59.svg'
              : '/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-60.svg'
          }
          alt="MonkeDAO Map List Toggle Icon"
        />
        {listOpen ? 'View Map' : 'View List'}
      </button>
      <div
        className={`Map-Wrapper__list ${
          listOpen ? 'Map-Wrapper__list--expanded' : ''
        }`}
      >
        <LocationList
          loading={state.matches('loading')}
          locations={visibleMarkers}
          virtualLocations={virtualLocations}
          activeLocation={hoveredMarker}
        />
      </div>
      <div className="Map-Wrapper__view">
        <button
          className="Map-Wrapper__view-refresher"
          onClick={() => reload()}
        >
          <img
            className="Map-Wrapper__view-refresher-icon"
            src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-78.svg"
            alt="MonkeDAO Map List Refresh Icon"
          />
          Refresh
        </button>
        <div className="Map" ref={container}></div>
      </div>
    </div>
  );
};
