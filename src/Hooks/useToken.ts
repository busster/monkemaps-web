import { useState } from 'react';

export default function useToken() {
  const getToken = () => {
    const tokenString = localStorage.getItem('token') || '{}';
    const userToken = JSON.parse(tokenString);
    return { token: userToken?.token, hw: userToken?.hw, txn: userToken?.txn };
  };

  const [token, setToken] = useState(getToken());

  const saveToken = (userToken: any) => {
    localStorage.setItem('token', JSON.stringify(userToken));
    setToken({
      token: userToken?.token,
      hw: userToken?.hw,
      txn: userToken?.txn,
    });
  };

  return {
    setToken: saveToken,
    token,
  };
}
