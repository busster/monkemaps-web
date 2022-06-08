import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef } from "xstate";

import { customAlphabet } from 'nanoid';
import { DateTime } from "luxon";

import { CONSTANTS } from "../constants";

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)

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

          console.log(startDate)

          return {
            id,
            startDate: DateTime.fromISO(startDate),
            endDate: DateTime.fromISO(endDate),
            type,
            name,
            virtual,
            coordinates: coordinates.reverse(),
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

          return {
            id: walletId,
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
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
