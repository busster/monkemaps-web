import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef } from "xstate";
import { CONSTANTS } from "../constants";

type UserContext = {
  walletId: string,
  lat: number,
  lng: number,
  nft: NFT,
};

type NFT = {
  imageUri: string,
  id: string,
}

type INPUT_LAT_EVENT = { type: 'INPUT_LAT', lat: number };
type INPUT_LNG_EVENT = { type: 'INPUT_LNG', lng: number };
type UserEvents =
  | { type: 'SAVE' }
  | { type: 'DELETE' }
  | { type: 'RESET' }
  | { type: 'DISCONNECT' }
  | INPUT_LAT_EVENT
  | INPUT_LNG_EVENT
  | SELECT_MONK_EVENT;

type SELECT_MONK_EVENT = { type: 'SELECT_MONK', nft: NFT };



const createUserContext = (walletId: string | undefined): UserContext => Object.assign({
  walletId,
  lat: 0,
  lng: 0,
  nft: {}
});

const fetchUser = async (context: UserContext) => {
  const response = await fetch(`${CONSTANTS.API_URL}/users/${context.walletId}`, {
    method: 'GET',
  });

  const res = await response.json();
  if (response.ok) {
    return res;
  } else {
    return Promise.reject({ status: response.status });
  }
}

const createUser = async (context: UserContext) => {
  const response = await fetch(`${CONSTANTS.API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletId: context.walletId,
      location: {
        latitude: context.lat,
        longitude: context.lng,
      },
      image: context.nft.imageUri,
      monkeIds: [context.nft.id]
    })
  });

  if (response.ok) {
    return Promise.resolve();
  } else {
    return Promise.reject({ status: response.status });
  }
}

const updateUser = async (context: UserContext) => {
  const response = await fetch(`${CONSTANTS.API_URL}/users/${context.walletId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletId: context.walletId,
      location: {
        latitude: context.lat,
        longitude: context.lng,
      },
      image: context.nft.imageUri,
      monkeIds: [context.nft.id]
    })
  });

  if (response.ok) {
    return Promise.resolve();
  } else {
    return Promise.reject({ status: response.status });
  }
}

const deleteUser = async (context: UserContext) => {
  const response = await fetch(`${CONSTANTS.API_URL}/users/${context.walletId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    return Promise.resolve();
  } else {
    return Promise.reject({ status: response.status });
  }
}

export const latValid = (n: number) => n > -90 && n < 90;
export const lngValid = (n: number) => n > -180 && n < 180;

const creatInputLatTransition = (baseStateTarget: string) => ([
  {
    target: `${baseStateTarget}.valid`,
    actions: ['setLat'],
    cond: 'latValid',
  },
  {
    target: `${baseStateTarget}.invalid`,
    actions: ['setLat'],
  }
]);
const createInputLngTransition = (baseStateTarget: string) => ([
  {
    target: `${baseStateTarget}.valid`,
    actions: ['setLng'],
    cond: 'lngValid',
  },
  {
    target: `${baseStateTarget}.invalid`,
    actions: ['setLng'],
  }
]);

export const createUserMachine = (walletId: string | undefined) => createMachine<UserContext, UserEvents>({
  id: 'user',

  context: createUserContext(walletId),

  initial: walletId ? 'loading' : 'none',

  states: {
    none: {},
    loading: {
      invoke: {
        src: (context, event) => fetchUser(context),
        onDone: {
          target: 'display',
          actions: ['setUser']
        },
        onError: [
          { target: 'create.valid', cond: 'userNotFound' },
          { target: 'error' }
        ]
      }
    },
    create: {
      states: {
        valid: {
          on: {
            SAVE: '#user.createUser'
          }
        },
        invalid: {},
      },
      on: {
        INPUT_LAT: creatInputLatTransition('create'),
        INPUT_LNG: createInputLngTransition('create'),
        SELECT_MONK: {
          actions: ['setNft']
        }
      }
    },
    display: {
      on: {
        INPUT_LAT: creatInputLatTransition('edit'),
        INPUT_LNG: createInputLngTransition('edit'),
        DELETE: 'deleteUser',
        SELECT_MONK: {
          target: 'edit.valid',
          actions: ['setNft']
        }
      }
    },
    edit: {
      states: {
        valid: {
          on: {
            SAVE: '#user.updateUser'
          }
        },
        invalid: {},
      },
      on: {
        RESET: 'loading',
        INPUT_LAT: creatInputLatTransition('edit'),
        INPUT_LNG: createInputLngTransition('edit'),
        SELECT_MONK: {
          actions: ['setNft']
        }
      }
    },
    error: {},

    createUser: {
      invoke: {
        src: (context, event) => createUser(context),
        onDone: 'display',
        onError: 'create.valid'
      }
    },
    updateUser: {
      invoke: {
        src: (context, event) => updateUser(context),
        onDone: 'display',
        onError: 'edit.valid'
      }
    },
    deleteUser: {
      invoke: {
        src: (context, event) => deleteUser(context),
        onDone: 'create.valid',
        onError: 'display'
      }
    }
  },
  on: {
    DISCONNECT: 'none',
  }
},
{
  actions: {
    setUser: assign({
      lat: (context, event: any) => parseFloat(event.data.location.latitude),
      lng: (context, event: any) => parseFloat(event.data.location.longitude),
    }),
    setLat: assign({
      lat: (context, event) => (event as INPUT_LAT_EVENT).lat
    }),
    setLng: assign({
      lng: (context, event) => (event as INPUT_LNG_EVENT).lng
    }),
    setNft: assign({
      nft: (context, event) => {console.log(event); return (event as SELECT_MONK_EVENT).nft}
    })
  },
  guards: {
    userNotFound: (context, event) => (event as any).data.status === 404,
    latValid: (context, event) => latValid((event as INPUT_LAT_EVENT).lat),
    lngValid: (context, event) => lngValid((event as INPUT_LNG_EVENT).lng)
  }
});

// export const mapService = interpret(mapMachine).start();
