export function getToken() {
    const tokenString = sessionStorage.getItem('token') || '{}';
    const userToken = JSON.parse(tokenString);
    return { token: userToken?.token, hw: userToken?.hw, txn: userToken?.txn };
  }

export function clearToken() {
    const tokenString = sessionStorage.getItem('token') || '{}';
    const userToken = JSON.parse(tokenString);
    if (userToken) {
        sessionStorage.removeItem('token');
    }
  }