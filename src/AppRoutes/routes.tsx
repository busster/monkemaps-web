import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { MapWrapper, Map, LocationDetails } from '../Map';
import { UserInformation, ViewUserInformation } from '../Profile';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/profile" element={<UserInformation />} />
      <Route path="/map" element={<MapWrapper />}>
        <Route path="" element={<Map />} />
        <Route path=":locationId" element={<LocationDetails />} />
      </Route>
      <Route path="/monke/:monkeId" element={<ViewUserInformation />} />
      <Route path="*" element={<Navigate to="/map"></Navigate>} />
    </Routes>
  );
};
