import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import { MapWrapper, Map, LocationDetails } from '../Map';
import { UserInformation } from '../Profile';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/profile" element={<UserInformation />} />
      <Route path="/map" element={<MapWrapper />}>
        <Route path="" element={<Map />} />
        <Route path=":locationId" element={<LocationDetails />} />
      </Route>
    </Routes>
  );
}
