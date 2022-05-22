import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";

import './App.css';

import { MapWrapper, Map, LocationDetails } from './Map';
import { ConnectWallet } from './ConnectWallet';

function App() {

  return (
    <Router>
      <div>
        <nav className='App__nav'>
          <div className='App__nav-logo-container'>
            <Link to="/map">
              <img className='App__nav-logo' src='/MonkeDAO_FullLogo_Dk+MidGreen_RGB.png' alt='MonkeDAO Logo' />
            </Link>
          </div>
          <div className='App__nav-links'>
            <Link className='App__nav-link' to="/connect-wallet">
              <img className='App__nav-link-logo' src='/MonkeDAO_Icons_Col/MonkeDAO_Icons_Working-66.svg' alt='MonkeDAO Crypto Logo' />
              Connect Wallet
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/connect-wallet" element={<ConnectWallet />} />
          <Route path="/map" element={<MapWrapper />}>
            <Route path="" element={<Map />} />
            <Route path=":locationId" element={<LocationDetails />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
