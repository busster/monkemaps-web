import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef } from "xstate";
import { customAlphabet } from "nanoid";

import { CONSTANTS } from "../constants";

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 20);

type NFT = {
  imageUri: string,
  id: string,
  monkeNo: string,
}
type Location = {
  id: string;
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

type SELECT_MONK_EVENT = { type: 'SELECT_MONK', nft: NFT };
type INPUT_LOCATION_EVENT = { type: 'INPUT_LOCATION', location: Location };
type INPUT_NICK_NAME_EVENT = { type: 'INPUT_NICK_NAME', nickName: string };
type INPUT_TWITTER_EVENT = { type: 'INPUT_TWITTER', twitter: string };
type INPUT_GITHUB_EVENT = { type: 'INPUT_GITHUB', github: string };
type INPUT_TELEGRAM_EVENT = { type: 'INPUT_TELEGRAM', telegram: string };
type INPUT_DISCORD_EVENT = { type: 'INPUT_DISCORD', discord: string };
type UserEvents =
  | { type: 'SAVE' }
  | { type: 'DELETE' }
  | { type: 'RESET' }
  | { type: 'DISCONNECT' }
  | SELECT_MONK_EVENT
  | INPUT_LOCATION_EVENT
  | INPUT_NICK_NAME_EVENT
  | INPUT_TWITTER_EVENT
  | INPUT_GITHUB_EVENT
  | INPUT_TELEGRAM_EVENT
  | INPUT_DISCORD_EVENT;

const createUserContext = (walletId: string | undefined): UserContext => Object.assign({
  walletId,
  nft: {},
  nickName: '',
  twitter: '',
  github: '',
  telegram: '',
  discord: '',
  location: {
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
  console.log('MONKE NO', context.nft.monkeNo);
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
        }
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
      nickName: (context, event: any) => event.data.nickName,
      twitter: (context, event: any) => event.data.twitter,
      github: (context, event: any) => event.data.github,
      telegram: (context, event: any) => event.data.telegram,
      discord: (context, event: any) => event.data.discord,
      location: (context, event: any) => ({
        id: nanoid(),
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
      location: (context, event) => (event as INPUT_LOCATION_EVENT).location
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
  },
  guards: {
    userNotFound: (context, event) => (event as any).data.status === 404,
  }
});
