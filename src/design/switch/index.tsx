import React, { useEffect, useMemo, useState } from 'react';

import { customAlphabet } from 'nanoid';

import './index.css';

const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  20,
);

type MDSwitchProps = {
  checked: boolean;
  setChecked: (checked: boolean) => void;
};

export const MDSwitch = (props: MDSwitchProps) => {
  const { checked, setChecked } = props;

  return (
    <button
      className={`md-switch ${checked ? 'md-switch-checked' : ''}`}
      onClick={() => setChecked(!checked)}
    >
      <div className="md-switch-handle"></div>
    </button>
  );
};
