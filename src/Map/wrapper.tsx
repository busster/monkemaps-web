import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import './wrapper.css';

export const MapWrapper: React.FunctionComponent = (): JSX.Element => {
  return (
    <Outlet />
  );
}
