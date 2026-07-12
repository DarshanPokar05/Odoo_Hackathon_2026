import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('assetflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('assetflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    async function validateSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        if (res?.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('assetflow_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          localStorage.removeItem('assetflow_token');
          localStorage.removeItem('assetflow_user');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    validateSession();
  }, [token]);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { token: jwtToken, user: userData } = res.data;
      localStorage.setItem('assetflow_token', jwtToken);
      localStorage.setItem('assetflow_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ email, password, fullName }) => {
    setLoading(true);
    try {
      const res = await authApi.signup({ email, password, fullName });
      const { token: jwtToken, user: userData } = res.data;
      localStorage.setItem('assetflow_token', jwtToken);
      localStorage.setItem('assetflow_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    return authApi.forgotPassword(email);
  };

  const resetPassword = async (data) => {
    return authApi.resetPassword(data);
  };

  const logout = () => {
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
