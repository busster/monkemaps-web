import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { MapWrapper, Map, LocationDetails } from '../Map';
import { UserInformation, ViewUserInformation } from '../Profile';
import useToken from '../Hooks/useToken';
import { Login } from '../Login/auth';

export const AppRoutes = () => {
  const { token, setToken } = useToken();
  return (
    <>
    {!token?.token ? (
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="*" element={<Navigate to="/login"></Navigate>} />
      </Routes>
    ) : (
      <Routes>
      <Route path="/profile" element={<UserInformation />} />
      <Route path="/map" element={<MapWrapper />}>
        <Route path="" element={<Map />} />
        <Route path=":locationId" element={<LocationDetails />} />
      </Route>
      <Route path="/monke/:monkeId" element={<ViewUserInformation />} />
      <Route path="*" element={<Navigate to="/map"></Navigate>} />
    </Routes>
    )}
    </>
  );
};
