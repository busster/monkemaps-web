import { useCallback, useState } from 'react';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { toast } from 'react-toastify';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { CONSTANTS } from '../constants';
import {
  VStack,
  Checkbox,
  Button,
  Heading,
  SimpleGrid,
  Box,
  Center,
  Image,
} from '@chakra-ui/react';

//import './auth.css'

const bs58 = require('bs58');

export type LoginProps = {
  setToken: (token: any) => any;
};

export const Login = (props: LoginProps): JSX.Element => {
  const { setToken } = props;
  const navigate = useNavigate();
  const {
    publicKey,
    connected,
    connect,
    signMessage,
    signTransaction,
  } = useWallet();

  const { connection } = useConnection();
  const [isHardwareWallet, setIsHardwareWallet] = useState(false);
  const walletId = publicKey?.toBase58() ?? '';
  const verify = useCallback(async () => {
    if (!connected) {
      await connect();
    }
    try {
      toast.info('Logging you in...', {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 2500,
      });
      const message = `Sign this message for authenticating with your wallet. Nonce: ${walletId}`;
      const conn = connection as Connection;
      if (isHardwareWallet) {
        if (!signTransaction) {
          toast.error('Wallet does not support signing transactions.', {
            position: toast.POSITION.TOP_CENTER,
          });
          return Promise.reject();
        }
        //hardcode for now
        const response = await fetch(`${CONSTANTS.API_URL}/auth/txn`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ walletId, message: btoa(message) }),
        });

        const res = await response.json();
        if (res?.token) {
          const latestBlockHash = await conn.getLatestBlockhash();
          const walletPk = new PublicKey(walletId);
          const transaction = new Transaction();
          transaction.feePayer = walletPk;
          transaction.recentBlockhash = latestBlockHash.blockhash;
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: walletPk,
              toPubkey: new PublicKey(res.destination),
              lamports: res.lamports,
            }),
          );
          const signedTxn = await signTransaction(transaction);
          const txnSerialized = signedTxn.serialize();
          const signature = await conn.sendRawTransaction(txnSerialized, {
            skipPreflight: true,
          });
          await conn.confirmTransaction(
            {
              blockhash: latestBlockHash.blockhash,
              lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
              signature,
            },
            'confirmed',
          );
          setToken({ token: res, hw: 'true', txn: signature });
          toast.success('Success! Redirecting...', {
            position: toast.POSITION.TOP_CENTER,
          });
          navigate(0);
        } else {
          toast.error(
            `Unsuccessful. Make sure you own a monke. ${res?.msg ?? ''}`,
            {
              position: toast.POSITION.TOP_CENTER,
            },
          );
        }
      } else {
        const encodedMessage = new TextEncoder().encode(message);
        if (!walletId) throw new Error('Wallet not connected!');
        if (!signMessage)
          throw new Error('Wallet does not support message signing!');
        const signedMessage = await signMessage(encodedMessage);
        const signedAndEncodedMessage = bs58.encode(signedMessage);
        const response = await fetch(`${CONSTANTS.API_URL}/auth/sign`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletId,
            message: btoa(message),
            signedMsg: signedAndEncodedMessage,
          }),
        });
        const tkn = await response.json();
        setToken({ token: tkn.token, hw: '' });
        if (tkn.token) {
          toast.success('Success! Redirecting...', {
            position: toast.POSITION.TOP_CENTER,
          });
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate(0);
        } else {
          toast.error(
            `Unsuccessful. Make sure you own a monke. ${tkn?.msg ?? ''}`,
            {
              position: toast.POSITION.TOP_CENTER,
            },
          );
        }
      }
    } catch (err: any) {
      console.log('ERROR >>>', err, err?.message);
      toast.error('Failed to login.', {
        position: toast.POSITION.TOP_CENTER,
      });
      return Promise.reject(err);
    }
  }, [publicKey, isHardwareWallet]);

  return (
    <VStack>
      <Box height="10px"></Box>
      <SimpleGrid
        minChildWidth="400px"
        columns={1}
        spacing={10}
        borderWidth="1px"
        boxShadow={'lg'}
        borderRadius="lg"
      >
        <Box height="10px" />
        <Center h="20px">
          <Box height="10px">
            <Image
              maxWidth={'200px'}
              objectFit="cover"
              src="/MonkeDAO_FullLogoHoriz_DkGreen_PANTONE.png"
            />
          </Box>
        </Center>
        <Center h="10px">
          <Box height="10px">
            <Heading fontSize={'Large'}>Authenticate your Monke Wallet</Heading>
          </Box>
        </Center>
        <Box height="10px">
          <Center h="50px">
            <Checkbox
              size="lg"
              spacing="1rem"
              colorScheme="green"
              checked={isHardwareWallet}
              onChange={(e: any) => setIsHardwareWallet(e.target.checked)}
            >
              Using Hardware wallet?
            </Checkbox>
          </Center>
        </Box>
        <Box height="80px">
          <Center h="100px">
            <Button onClick={verify} disabled={!connected && !publicKey}>
              <img
                className="Profile__back-icon"
                src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-61.svg"
                alt="MonkeDAO Profile Back Icon"
              />
              Authenticate
            </Button>
          </Center>
        </Box>
        <Box height="5px" />
      </SimpleGrid>
    </VStack>
  );
};
