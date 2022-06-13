import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef, Interpreter, ResolveTypegenMeta, TypegenDisabled, BaseActionObject, ServiceMap } from "xstate";
import { customAlphabet } from "nanoid";

import { CONSTANTS } from "../constants";
import { mapService } from "../Map/machine";

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20);

export const lookupPlaces = async (searchTerm: string) => {
  const response = await fetch(`${CONSTANTS.MAPBOX_PLACES_API}/${searchTerm}.json?access_token=${CONSTANTS.MAPBOX_ACCESS_TOKEN}`, {
    method: 'GET',
  });
  
  const res = await response.json();
  const results = res.features.map((f: any) => ({
    id: f.id,
    text: f.place_name,
    coordinates: f.geometry.coordinates.reverse()
}))
  if (response.ok) {
    return results;
  } else {
    return Promise.reject({ status: response.status });
  }
}

type NFT = {
  imageUri: string | undefined,
  id: string,
  monkeNo: string | undefined,
}
type Location = {
  id: string,
  enabled: boolean,
  text: string,
  coordinates: [number, number],
}
type UserContext = {
  walletId: string,
  nickName: string,
  twitter: string,
  github: string,
  telegram: string,
  discord: string,
  nft: NFT,
  location: Location,
};

type CONNECT_EVENT = { type: 'CONNECT', walletId: string };
type SELECT_MONK_EVENT = { type: 'SELECT_MONK', nft: NFT };
type INPUT_LOCATION_EVENT = { type: 'INPUT_LOCATION', location: Location };
type INPUT_NICK_NAME_EVENT = { type: 'INPUT_NICK_NAME', nickName: string };
type INPUT_TWITTER_EVENT = { type: 'INPUT_TWITTER', twitter: string };
type INPUT_GITHUB_EVENT = { type: 'INPUT_GITHUB', github: string };
type INPUT_TELEGRAM_EVENT = { type: 'INPUT_TELEGRAM', telegram: string };
type INPUT_DISCORD_EVENT = { type: 'INPUT_DISCORD', discord: string };
type ENABLE_LOCATION_EVENT = { type: 'INPUT_LOCATION_ENABLED', enabled: boolean, targetState: string };
type UserEvents =
  | { type: 'SAVE' }
  | { type: 'DELETE' }
  | { type: 'RESET' }
  | { type: 'DISCONNECT' }
  | CONNECT_EVENT
  | SELECT_MONK_EVENT
  | INPUT_LOCATION_EVENT
  | INPUT_NICK_NAME_EVENT
  | INPUT_TWITTER_EVENT
  | INPUT_GITHUB_EVENT
  | INPUT_TELEGRAM_EVENT
  | INPUT_DISCORD_EVENT
  | ENABLE_LOCATION_EVENT;

const createUserContext = (walletId: string | undefined): UserContext => Object.assign({
  walletId,
  nft: {},
  nickName: '',
  twitter: '',
  github: '',
  telegram: '',
  discord: '',
  location: {
    enabled: false,
    text: '',
    coordinates: [0,0]
  }
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

const findLocation = (event: ENABLE_LOCATION_EVENT): Promise<{ location: Location, targetState: string }> => {
  return new Promise((resolve, reject) => {
    const success = (position: any) => {
      const { latitude, longitude } = position.coords
      
      lookupPlaces(`${longitude},${latitude}`).then((places: any) => {
        if (!places || places.length === 0) {
          reject();
        }
        const place = places[0];
        resolve({
          location: {
            ...place,
            enabled: true,
            coordinates: [latitude, longitude]
          },
          targetState: event.targetState
        })
      }).catch(reject);
    }
    navigator.geolocation.getCurrentPosition(success, reject);
  })
}

const createUser = async (context: UserContext) => {
  const response = await fetch(`${CONSTANTS.API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletId: context.walletId,
      nickName: context.nickName,
      twitter: context.twitter,
      github: context.github,
      telegram: context.telegram,
      discord: context.discord,
      location: {
        ...context.location,
        latitude: context.location.coordinates[0],
        longitude: context.location.coordinates[0],
      },
      image: context.nft.imageUri,
      monkeId: context.nft.id,
      monkeNumber: context.nft.monkeNo
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
      nickName: context.nickName,
      twitter: context.twitter,
      github: context.github,
      telegram: context.telegram,
      discord: context.discord,
      location: {
        ...context.location,
        latitude: context.location.coordinates[0],
        longitude: context.location.coordinates[1],
      },
      image: context.nft.imageUri,
      monkeId: context.nft.id,
      monkeNumber: context.nft.monkeNo
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

export const createUserMachine = (walletId: string | undefined) => createMachine<UserContext, UserEvents>({
  id: 'user',

  context: createUserContext(walletId),

  initial: walletId ? 'loading' : 'none',

  states: {
    none: {
      on: {
        CONNECT: {
          target: 'loading',
          actions: ['setWalletId']
        }
      }
    },
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
    findLocation: {
      invoke: {
        src: (context, event) => findLocation(event as ENABLE_LOCATION_EVENT),
        onDone: [
          {
            target: 'edit.valid',
            actions: ['setFoundLocation'],
            cond: (context, event) => event.data.targetState.includes('display')
          },
          {
            target: 'create.valid',
            actions: ['setFoundLocation'],
            cond: (context, event) => event.data.targetState.includes('create') && event.data.targetState.includes('valid')
          },
          {
            target: 'create.invalid',
            actions: ['setFoundLocation'],
            cond: (context, event) => event.data.targetState.includes('create') && event.data.targetState.includes('invalid')
          },
          {
            target: 'edit.valid',
            actions: ['setFoundLocation'],
            cond: (context, event) => event.data.targetState.includes('edit') && event.data.targetState.includes('valid')
          },
          {
            target: 'edit.invalid',
            actions: ['setFoundLocation'],
            cond: (context, event) => event.data.targetState.includes('edit') && event.data.targetState.includes('invalid')
          }
        ],
        onError: {
          target: 'loading'
        }
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
        SELECT_MONK: {
          actions: ['setNft']
        },
        INPUT_LOCATION: {
          actions: ['setLocation']
        },
        INPUT_NICK_NAME: {
          actions: ['setNickName'],
        },
        INPUT_TWITTER: {
          actions: ['setTwitter'],
        },
        INPUT_GITHUB: {
          actions: ['setGithub'],
        },
        INPUT_DISCORD: {
          actions: ['setDiscord'],
        },
        INPUT_TELEGRAM: {
          actions: ['setTelegram'],
        },
        INPUT_LOCATION_ENABLED: [
          {
            target: 'findLocation',
            actions: ['setLocationEnabled'],
            cond: 'geolocationEnabled'
          },
          {
            actions: ['setLocationEnabled']
          }
        ],
      }
    },
    display: {
      on: {
        DELETE: 'deleteUser',
        SELECT_MONK: {
          target: 'edit.valid',
          actions: ['setNft']
        },
        INPUT_LOCATION: {
          target: 'edit.valid',
          actions: ['setLocation']
        },
        INPUT_NICK_NAME: {
          target: 'edit.valid',
          actions: ['setNickName'],
        },
        INPUT_TWITTER: {
          target: 'edit.valid',
          actions: ['setTwitter'],
        },
        INPUT_GITHUB: {
          target: 'edit.valid',
          actions: ['setGithub'],
        },
        INPUT_DISCORD: {
          target: 'edit.valid',
          actions: ['setDiscord'],
        },
        INPUT_TELEGRAM: {
          target: 'edit.valid',
          actions: ['setTelegram'],
        },
        INPUT_LOCATION_ENABLED: [
          {
            target: 'findLocation',
            actions: ['setLocationEnabled'],
            cond: 'geolocationEnabled'
          },
          {
            target: 'edit.valid',
            actions: ['setLocationEnabled']
          }
        ],
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
        SELECT_MONK: {
          actions: ['setNft']
        },
        INPUT_LOCATION: {
          actions: ['setLocation']
        },
        INPUT_NICK_NAME: {
          actions: ['setNickName'],
        },
        INPUT_TWITTER: {
          actions: ['setTwitter'],
        },
        INPUT_GITHUB: {
          actions: ['setGithub'],
        },
        INPUT_DISCORD: {
          actions: ['setDiscord'],
        },
        INPUT_TELEGRAM: {
          actions: ['setTelegram'],
        },
        INPUT_LOCATION_ENABLED: [
          {
            target: 'findLocation',
            actions: ['setLocationEnabled'],
            cond: 'geolocationEnabled'
          },
          {
            actions: ['setLocationEnabled']
          }
        ],
      }
    },
    error: {},

    createUser: {
      invoke: {
        src: (context, event) => createUser(context),
        onDone: {
          target: 'display',
          actions: ['reloadMap']
        },
        onError: 'create.valid'
      }
    },
    updateUser: {
      invoke: {
        src: (context, event) => updateUser(context),
        onDone: {
          target: 'display',
          actions: ['reloadMap']
        },
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
    setWalletId: assign({
      walletId: (context, event) => (event as CONNECT_EVENT).walletId
    }),
    setUser: assign({
      nickName: (context, event: any) => event.data.nickName,
      twitter: (context, event: any) => event.data.twitter,
      github: (context, event: any) => event.data.github,
      telegram: (context, event: any) => event.data.telegram,
      discord: (context, event: any) => event.data.discord,
      location: (context, event: any) => ({
        id: nanoid(),
        enabled: event.data.location.text ? true : false,
        text: event.data.location.text,
        coordinates: [parseFloat(event.data.location.latitude), parseFloat(event.data.location.longitude)]
      }),
      nft: (context, event: any) => ({
        id: event.data.monkeId || '',
        imageUri: event.data.image ?? '',
        monkeNo: event.data.monkeNo ?? ''
      })
    }),
    setNft: assign({
      nft: (context, event) => (event as SELECT_MONK_EVENT).nft
    }),
    setLocation: assign({
      location: (context, event) => ({
        ...context.location,
        ...(event as INPUT_LOCATION_EVENT).location
      })
    }),
    setNickName: assign({
      nickName: (context, event) => (event as INPUT_NICK_NAME_EVENT).nickName
    }),
    setTwitter: assign({
      twitter: (context, event) => (event as INPUT_TWITTER_EVENT).twitter
    }),
    setGithub: assign({
      github: (context, event) => (event as INPUT_GITHUB_EVENT).github
    }),
    setTelegram: assign({
      telegram: (context, event) => (event as INPUT_TELEGRAM_EVENT).telegram
    }),
    setDiscord: assign({
      discord: (context, event) => (event as INPUT_DISCORD_EVENT).discord
    }),
    setLocationEnabled: assign({
      location: (context, event) => {
        const enabled = (event as ENABLE_LOCATION_EVENT).enabled;
        const location = enabled ?
          context.location :
          {
            id: '',
            enabled: false,
            text: '',
            coordinates: [0,0]
          } as Location;

        return {
          ...location,
          enabled: (event as ENABLE_LOCATION_EVENT).enabled
        }
      }
    }),
    setFoundLocation: assign({
      location: (context, event: any) => event.data.location
    }),
    reloadMap: (context, event) => {
      mapService.send('RELOAD');
    }
  },
  guards: {
    userNotFound: (context, event) => (event as any).data.status === 404,
    geolocationEnabled: (context, event) => (event as ENABLE_LOCATION_EVENT).enabled && !!navigator.geolocation
  }
});

export const UserMachine = (() => {
  let service: Interpreter<UserContext, any, UserEvents, {
    value: any;
    context: UserContext;
}, ResolveTypegenMeta<TypegenDisabled, UserEvents, BaseActionObject, ServiceMap>>;

  return {
    get: (walletId: string | undefined) => {
      if (!service) {
        service = interpret(createUserMachine(walletId)).start();
      }
      return service;
    }
  }
})()
