import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef } from "xstate";

import { customAlphabet } from 'nanoid';
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
};

type MapContext = {
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
            src: (context, event) => fetchEvents(),
            onDone: {
              target: 'loaded',
              actions: ['setPins']
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
        const pinsData = (event as any).data;

        const pins = pinsData.map((p: any) => {
          const { end_date, start_date, location, name, type, id } = p;

          const mappedLocation = typeof location === 'string' ? [0, 0] : location

          return {
            id,
            name,
            startDate: start_date,
            endDate: end_date,
            coordinates: mappedLocation,
            location,
            type
          }
        })

        return pins;
      }
    }),
  },
});

export const mapService = interpret(mapMachine).start();
