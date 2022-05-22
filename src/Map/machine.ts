import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef } from "xstate";

import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20)

type PinType = 'Event' | 'Person';

export type Pin = {
  id: string,
  type: PinType,
  name: string,
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
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 1000);
  });
  return [
    {
      id: nanoid(),
      name: 'Zolana CHI Happy Hour',
      type: 'Event',
      coordinates: [-122.392630, 47.649600],
    },
    {
      id: nanoid(),
      name: 'Test 2',
      type: 'Event',
      coordinates: [-122.373766, 47.648254],
    },
    {
      id: nanoid(),
      name: 'Test 3',
      type: 'Event',
      coordinates: [-122.402775, 47.661843],
    },
    {
      id: nanoid(),
      name: 'Thing',
      type: 'Person',
      coordinates: [-122.417395, 47.662108],
    }
  ]
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
        const pins = (event as any).data;
        return pins;
      }
    }),
  },
});

export const mapService = interpret(mapMachine).start();
