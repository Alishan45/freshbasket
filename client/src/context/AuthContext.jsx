import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('freshbasket_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('freshbasket_jwt_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('freshbasket_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('freshbasket_jwt_token', res.token);
      localStorage.setItem('freshbasket_user', JSON.stringify(res.user));
      return res.user;
    }
  }

  async function register(userData) {
    const res = await api.post('/auth/register', userData);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('freshbasket_jwt_token', res.token);
      localStorage.setItem('freshbasket_user', JSON.stringify(res.user));
      return res.user;
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('freshbasket_jwt_token');
    localStorage.removeItem('freshbasket_user');
  }

  async function updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem('freshbasket_user', JSON.stringify(res.user));
      return res.user;
    }
  }

  // Instant 1-Click Demo Accounts
  async function loginDemo(role) {
    let email = 'customer@freshbasket.com';
    let pass = 'Customer@123';
    if (role === 'admin') {
      email = 'admin@freshbasket.com';
      pass = 'Admin@123';
    } else if (role === 'supplier') {
      email = 'supplier@freshbasket.com';
      pass = 'Supplier@123';
    } else if (role === 'logistics') {
      email = 'logistics@freshbasket.com';
      pass = 'Logistics@123';
    }
    return login(email, pass);
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSupplier: user?.role === 'supplier',
    isLogistics: user?.role === 'logistics',
    login,
    register,
    logout,
    updateProfile,
    loginDemo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
