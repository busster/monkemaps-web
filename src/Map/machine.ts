import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef } from "xstate";

import { customAlphabet } from 'nanoid';
import { DateTime } from "luxon";

import { CONSTANTS } from "../constants";

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20);

const getNewLatLng = (pin: any, i: number) => {
  const coordinates = pin.location.coordinates;
  const angle = Math.PI*(3.0-Math.sqrt(5.0));
  const r = i;
  const theta = i * angle;
  const x = r * Math.cos(theta) * 0.01;
  const y = r * Math.sin(theta) * 0.01;
  return [coordinates[0] + x, coordinates[1] + y]
}

type PinType = 'MonkeDAO Discord'
| 'Monke_Talks Podcast'
| 'Monke Country Club'
| 'MonkeDAO Twitter'
| 'MonkeDAO Meet-up'
| 'Mainstream Event'
| 'MonkeDAO Event';

export type Pin = {
  id: string,
  type: PinType,
  name: string,
  location: string,
  coordinates: [lat: number, lng: number],
  text: string,
  virtual: boolean,
  startDate: DateTime,
  endDate: DateTime,
  link: string,
  extraLink: string,
  contacts: string[]
};
export type User = {
  id: string,
  location: string,
  coordinates: [lat: number, lng: number],
  monkeNumber: string,
  nickName: string,
  twitter: string,
  github: string,
  telegram: string,
  discord: string,
  text: string,
};

type MapContext = {
  users: User[],
  pins: Pin[],
  visiblePins: Pin[],
};

// type SetVisibleMarkersEvent = { type: 'SET_VISIBLE_MARKERS', markers: string[] }
type MapEvents =
  // | SetVisibleMarkersEvent
  | { type: 'RENDER' }
  | { type: 'POINT' }
  | { type: 'REPOINT' }
  | { type: 'LIST' }
  | { type: 'RELOAD' };


const fetchEvents = async () => {
  const response = await fetch(`${CONSTANTS.API_URL}/events`, {
    method: 'GET',
  });

  const res = await response.json();
  console.log(res);

  if (response.ok) {
    return res;
  } else {
    return Promise.reject({ status: response.status });
  }
}

const fetchUsers = async () => {
  const response = await fetch(`${CONSTANTS.API_URL}/users`, {
    method: 'GET',
  });

  const res = await response.json();
  console.log(res);

  if (response.ok) {
    return res;
  } else {
    return Promise.reject({ status: response.status });
  }
}

const fetchAll = async () => {
  const events = await fetchEvents();
  const users = await fetchUsers();

  return { events, users }
}

const defaultMapContext: MapContext = Object.assign({
  pins: [],
});

export const mapMachine = createMachine<MapContext, MapEvents>({
  id: 'map',

  context: defaultMapContext,

  type: 'parallel',

  states: {
    data: {
      initial: 'loading',
      states: {
        loading: {
          invoke: {
            src: (context, event) => fetchAll(),
            onDone: {
              target: 'loaded',
              actions: ['setPins', 'setUsers']
            },
            onError: 'error'
          }
        },
        loaded: {},
        error: {},
      },
      on: {
        RELOAD: 'data.loading',
      }
    },
    display: {
      initial: 'none',
      states: {
        none: {
          on: {
            RENDER: 'map',
          }
        },
        map: {
          on: {
            POINT: 'points'
          }
        },
        points: {
          on: {
            REPOINT: 'map',
          }
        },
      },
      on: {
        RELOAD: 'display.map',
      }
    },
  },
},
{
  actions: {
    setPins: assign({
      pins: (context, event) => {
        const pinsData = (event as any).data.events;

        const pinsMap = pinsData.reduce((acc: Map<string, any>, next: any) => {
          const coords = next.location.coordinates;
          const key = coords.join(',');
          const existing = acc.get(key);
          const value = existing ? [...existing, next] : [next];
          acc.set(key, value);
          return acc;
        }, new Map<string, any>());

        const pins = pinsData.map((p: any) => {
          const {
            id,
            startDate,
            endDate,
            type,
            name,
            location,
            virtual,
            status,
            extraLink,
            contacts
          } = p;

          const {
            coordinates,
            hasLink,
            text,
            link,
          } = location;

          let coords = coordinates;
          const found = pinsMap.get(coordinates.join(','));
          if (found.length > 1) {
            const i = found.findIndex((fp: any) => p.id === fp.id);
            coords = getNewLatLng(p, i);
          }

          console.log(startDate)

          return {
            id,
            startDate: DateTime.fromISO(startDate),
            endDate: DateTime.fromISO(endDate),
            type,
            name,
            virtual,
            coordinates: coords.reverse(),
            text,
            link,
            extraLink,
            contacts
          }
        })

        return pins;
      }
    }),
    setUsers: assign({
      users: (context, event) => {
        const pinsData = (event as any).data.users;

        const pinsMap = pinsData.reduce((acc: Map<string, any>, next: any) => {
          const coords = [next.location.latitude, next.location.longitude];
          const key = coords.join(',');
          const existing = acc.get(key);
          const value = existing ? [...existing, next] : [next];
          acc.set(key, value);
          return acc;
        }, new Map<string, any>());

        const pins = pinsData.map((p: any) => {
          const {
            walletId,
            twitter,
            nickName,
            github,
            telegram,
            discord,
            monkeNumber,
            location
          } = p;

          const {
            latitude,
            longitude,
            text,
          } = location;
          console.log(location);

          const coordinates = [parseFloat(latitude), parseFloat(longitude)];
          let coords = coordinates;
          const found = pinsMap.get(coordinates.join(','));
          if (found.length > 1) {
            const i = found.findIndex((fp: any) => p.id === fp.id);
            coords = getNewLatLng(p, i);
          }

          return {
            id: walletId,
            coordinates: coords.reverse(),
            text,
            twitter,
            nickName,
            github,
            telegram,
            discord,
            monkeNumber,
          }
        })

        return pins;
      }
    }),
  },
});

export const mapService = interpret(mapMachine).start();
