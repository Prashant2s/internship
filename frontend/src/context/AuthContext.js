import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { config } from '../config.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    } else if (t && !u) {
      setToken(t);
    }
  }, []);

  useEffect(() => {
    axios.defaults.baseURL = config.API_BASE;
    axios.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }, [token]);

  useEffect(() => {
    // If we have a token but no user (or to refresh role), fetch /me
    const fetchMe = async () => {
      if (!token) return;
      try {
        const { data } = await axios.get('/api/auth/me');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (e) {
        // Token invalid
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    };
    fetchMe();
  }, [token]);

  const login = async ({ email, password }) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async ({ username, email, password }) => {
    const { data } = await axios.post('/api/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // New helpers
  const resendVerification = async (email) => {
    await axios.post('/api/auth/resend-verification', { email });
  };

  const verifyEmail = async (token) => {
    const { data } = await axios.post('/api/auth/verify-email', { token });
    // Optionally refresh user
    try {
      const me = await axios.get('/api/auth/me');
      setUser(me.data.user);
      localStorage.setItem('user', JSON.stringify(me.data.user));
    } catch {}
    return data;
  };

  const forgotPassword = async (email) => {
    await axios.post('/api/auth/forgot-password', { email });
  };

  const resetPassword = async (token, newPassword) => {
    await axios.post('/api/auth/reset-password', { token, newPassword });
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, register, logout, resendVerification, verifyEmail, forgotPassword, resetPassword }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
