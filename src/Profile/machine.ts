import { assign, ActionObject, createMachine, TransitionsConfig, interpret, spawn, ActorRef, Interpreter, ResolveTypegenMeta, TypegenDisabled, BaseActionObject, ServiceMap } from "xstate";
import { customAlphabet } from "nanoid";

import { CONSTANTS } from "../constants";
import { mapService } from "../Map/machine";
import { WalletContextState, useConnection, ConnectionContextState } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

const bs58 = require('bs58');

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
  signMessage: any,
  signTransaction: any,
  sendTransaction: any,
  nickName: string,
  twitter: string,
  github: string,
  telegram: string,
  discord: string,
  nft: NFT,
  location: Location,
  isHardware: boolean,
  connection: any,
};

type CONNECT_EVENT = { type: 'CONNECT', wallet: WalletContextState };
type SELECT_MONK_EVENT = { type: 'SELECT_MONK', nft: NFT };
type INPUT_LOCATION_EVENT = { type: 'INPUT_LOCATION', location: Location };
type INPUT_NICK_NAME_EVENT = { type: 'INPUT_NICK_NAME', nickName: string };
type INPUT_TWITTER_EVENT = { type: 'INPUT_TWITTER', twitter: string };
type INPUT_GITHUB_EVENT = { type: 'INPUT_GITHUB', github: string };
type INPUT_TELEGRAM_EVENT = { type: 'INPUT_TELEGRAM', telegram: string };
type INPUT_DISCORD_EVENT = { type: 'INPUT_DISCORD', discord: string };
type ENABLE_LOCATION_EVENT = { type: 'INPUT_LOCATION_ENABLED', enabled: boolean, targetState: string };
type IS_HARDWARE_WALLET_EVENT = { type: 'IS_HARDWARE_WALLET', isHardware: boolean };
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
  | ENABLE_LOCATION_EVENT
  | IS_HARDWARE_WALLET_EVENT;

const createUserContext = (wallet: WalletContextState | undefined, walletId: string | undefined, connection: Connection | undefined): UserContext => {
  return Object.assign({
    walletId: walletId || wallet?.publicKey?.toBase58(),
    signMessage: wallet?.signMessage,
    signTransaction: wallet?.signTransaction,
    sendTransaction: wallet?.sendTransaction,
    connection,
    nft: {},
    nickName: '',
    twitter: '',
    github: '',
    telegram: '',
    discord: '',
    location: {
      enabled: false,
      text: '',
      coordinates: [0, 0]
    },
    isHardware: false,
  });
}

const mapHeaders = async (context: UserContext) => {
  const { walletId, signMessage, sendTransaction, signTransaction, isHardware, connection } = context;
  const conn = connection as Connection;
  if (isHardware) {
    const blockHash = (await conn.getLatestBlockhash()).blockhash;
    const walletPk = new PublicKey(walletId);
    const transaction = new Transaction();
    transaction.feePayer = walletPk;
    transaction.recentBlockhash = blockHash;
    transaction.add(SystemProgram.transfer({
      fromPubkey: walletPk,
      toPubkey: walletPk,
      lamports: 1,
    }));
    const signedTxn = await signTransaction(transaction);
    const signature = await sendTransaction(signedTxn, conn);
    await connection.confirmTransaction(signature, 'confirmed');
    return {
      'x-auth-txn': signature,
      'x-auth-nonce': walletId,
      'x-auth-message': '',
      'x-auth-signed': '',
      'x-auth-pk': walletId,
    }
  }
  else {
    const message = `Sign this message for authenticating with your wallet. Nonce: ${walletId}`;
    const encodedMessage = new TextEncoder().encode(message);
    if (!walletId) throw new Error("Wallet not connected!");
    if (!signMessage) throw new Error("Wallet does not support message signing!");
    const signedMessage = await signMessage(encodedMessage);
    const signedAndEncodedMessage = bs58.encode(signedMessage);
    return {
      'x-auth-txn': '',
      'x-auth-nonce': walletId,
      'x-auth-message': btoa(message),
      'x-auth-signed': signedAndEncodedMessage,
      'x-auth-pk': walletId,
    }
  }
};

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
  const defaultLocation = {
    id: '',
    enabled: true,
    text: '',
    coordinates: [0, 0]
  } as Location;

  return new Promise((resolve, reject) => {
    const error = (e: any) => {
      resolve({ location: defaultLocation, targetState: event.targetState });
    }

    const success = (position: any) => {
      const { latitude, longitude } = position.coords;

      lookupPlaces(`${longitude},${latitude}`).then((places: any) => {
        if (!places || places.length === 0) {
          error(null);
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
      }).catch(error);
    }
    navigator.geolocation.getCurrentPosition(success, error);
  })
}

const createUser = async (context: UserContext) => {
  const response = await fetch(`${CONSTANTS.API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...await mapHeaders(context),
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
      ...await mapHeaders(context),
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
    headers: {
      ...await mapHeaders(context),
    }
  });

  if (response.ok) {
    return Promise.resolve();
  } else {
    return Promise.reject({ status: response.status });
  }
}

export const createUserMachine = ({ wallet, connection, walletId }: { wallet?: WalletContextState, connection?: Connection, walletId?: string }) => createMachine<UserContext, UserEvents>({
  id: 'user',

  context: createUserContext(wallet, walletId, connection),

  initial: (walletId || wallet?.publicKey?.toBase58()) ? 'loading' : 'none',

  states: {
    none: {
      on: {
        CONNECT: {
          target: 'loading',
          actions: ['setWallet']
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
          target: 'loading',
          actions: (context, event) => {
            console.log('THIS BROKE???')
          }
        }
      }
    },
    create: {
      states: {
        valid: {
          on: {
            SAVE: [
              {
                target: '#user.createUser',
                cond: 'hasAllRequiredFields',
              },
              {
                target: 'invalid'
              }
            ],
          }
        },
        invalid: {},
      },
      on: {
        SELECT_MONK: [
          {
            actions: ['setNft'],
            target: '.valid',
            cond: 'hasAllRequiredFields'
          },
          {
            actions: ['setNft'],
            target: '.invalid',
          }
        ],
        INPUT_LOCATION: {
          actions: ['setLocation']
        },
        INPUT_NICK_NAME: [
          {
            actions: ['setNickName'],
            target: '.valid',
            cond: 'hasAllRequiredFields'
          },
          {
            actions: ['setNickName'],
            target: '.invalid',
          }
        ],
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
        IS_HARDWARE_WALLET: {
          actions: ['setIsHardware'],
        }
      }
    },
    display: {
      on: {
        DELETE: 'deleteUser',
        SELECT_MONK: [
          {
            actions: ['setNft'],
            target: 'edit.valid',
            cond: 'hasAllRequiredFields'
          },
          {
            actions: ['setNft'],
            target: 'edit.invalid',
          }
        ],
        INPUT_LOCATION: {
          target: 'edit.valid',
          actions: ['setLocation']
        },
        INPUT_NICK_NAME: [
          {
            actions: ['setNickName'],
            target: 'edit.valid',
            cond: 'hasAllRequiredFields'
          },
          {
            actions: ['setNickName'],
            target: 'edit.invalid',
          }
        ],
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
        IS_HARDWARE_WALLET: {
          target: 'edit.valid',
          actions: ['setIsHardware'],
        }
      }
    },
    edit: {
      states: {
        valid: {
          on: {
            SAVE: [
              {
                target: '#user.updateUser',
                cond: 'hasAllRequiredFields',
              },
              {
                target: 'invalid'
              }
            ]
          }
        },
        invalid: {},
      },
      on: {
        RESET: 'loading',
        SELECT_MONK: [
          {
            actions: ['setNft'],
            target: '.valid',
            cond: 'hasAllRequiredFields'
          },
          {
            actions: ['setNft'],
            target: '.invalid',
          }
        ],
        INPUT_LOCATION: {
          actions: ['setLocation']
        },
        INPUT_NICK_NAME: [
          {
            actions: ['setNickName'],
            target: '.valid',
            cond: 'hasAllRequiredFields'
          },
          {
            actions: ['setNickName'],
            target: '.invalid',
          }
        ],
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
        IS_HARDWARE_WALLET: {
          actions: ['setIsHardware'],
        }
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
        onDone: {
          target: 'create.valid',
          actions: ['reloadMap']
        },
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
      setWallet: assign({
        walletId: (context, event) => (event as CONNECT_EVENT).wallet.publicKey?.toBase58() || '',
        signMessage: (context, event) => (event as CONNECT_EVENT).wallet.signMessage,
        signTransaction: (context, event) => (event as CONNECT_EVENT).wallet.signTransaction,
        sendTransaction: (context, event) => (event as CONNECT_EVENT).wallet.sendTransaction,
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
              coordinates: [0, 0]
            } as Location;

          return {
            ...location,
            enabled: (event as ENABLE_LOCATION_EVENT).enabled
          }
        }
      }),
      setIsHardware: assign({
        isHardware: (context, event: any) => (event as IS_HARDWARE_WALLET_EVENT).isHardware
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
      geolocationEnabled: (context, event) => (event as ENABLE_LOCATION_EVENT).enabled && !!navigator.geolocation,
      hasAllRequiredFields: (context, event: any) => {
        const nft = event.nft !== undefined ? event.nft : context.nft;
        const nickName = event.nickName !== undefined ? event.nickName : context.nickName;
        return !!nft.id && nickName.length > 0;
      },
    }
  });

export const UserMachine = (() => {
  let service: Interpreter<UserContext, any, UserEvents, {
    value: any;
    context: UserContext;
  }, ResolveTypegenMeta<TypegenDisabled, UserEvents, BaseActionObject, ServiceMap>>;

  return {
    get: ({ wallet, connection, walletId }: { wallet?: WalletContextState, connection?: Connection, walletId?: string }) => {
      if (!service) {
        service = interpret(createUserMachine({ wallet, connection, walletId })).start();
      }
      return service;
    }
  }
})()
