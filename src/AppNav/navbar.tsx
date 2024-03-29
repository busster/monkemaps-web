import { useEffect } from 'react';
import {
  useWallet,
  useConnection,
} from '@solana/wallet-adapter-react';
import {
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { Link } from 'react-router-dom';

import '@solana/wallet-adapter-react-ui/styles.css';
import '../App.css';
import { UserMachine } from '../Profile/machine';
import { getToken, clearToken } from '../utils/tokenUtils';
import { Button } from '@chakra-ui/react';

export const AppNavBar = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const token = getToken();
  const { publicKey } = wallet;

  useEffect(() => {
    if (!publicKey) {
      const service = UserMachine.get({});
      service.send('DISCONNECT');
      return;
    }

    const service = UserMachine.get({ wallet });
    service.send('CONNECT', { wallet, connection });
  }, [publicKey, connection]);
  const doLogout = () => {
    clearToken();
    wallet.disconnect().then(() => {
      window.location.reload();
    })
  };
  return (
    <nav className="App__nav">
      <div className="App__nav-logo-container">
        <Link to="/map">
          <img
            className="App__nav-logo"
            src="/MonkeDAO_FullLogo_Dk+MidGreen_RGB.png"
            alt="MonkeDAO Logo"
          />
        </Link>
      </div>
      <div className="App__nav-links">
        {publicKey && token?.token ? (
          <><Link className="App__nav-link" to="/profile">
            <img
              className="App__nav-link-logo"
              src="/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-67.svg"
              alt="MonkeDAO Crypto Logo" />
            Profile
          </Link><Button backgroundColor={'#4a8f5d'} _hover={{bg: '#86c994'}} color={'#ffc919'} variant="outline" onClick={doLogout}> Logout</Button></>
        ) : (
          <WalletMultiButton />
        )}
      </div>
    </nav>
  );
};
