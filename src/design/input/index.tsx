import React, { useEffect, useMemo, useState } from 'react';

import { customAlphabet } from 'nanoid';

import './index.css';

const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  20,
);

type MDInputProps = {
  id?: string;
  label?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  type?: React.HTMLInputTypeAttribute;
  value?: string | number | readonly string[];
  readonly?: boolean;
};

export const MDInput = (props: MDInputProps) => {
  const { id, label, defaultValue, onChange, error, type, value, readonly } =
    props;

  const inputId = id || nanoid();

  return (
    <div className="md-input__container">
      {label && (
        <label
          className={`md-input__label ${error ? 'md-input__label--error' : ''}`}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`md-input ${error ? 'md-input--error' : ''}`}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={readonly}
      ></input>
    </div>
  );
};
