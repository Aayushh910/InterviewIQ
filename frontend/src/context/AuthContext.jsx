import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('interviewiq_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('interviewiq_token');
  });

  const [loading, setLoading] = useState(true);

  // Validate Token and Fetch Auth User Profile on Mount
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      const token = localStorage.getItem('interviewiq_token');
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiClient.get('/auth/me');
        if (isMounted && res.data) {
          setUser(res.data);
          setIsAuthenticated(true);
          localStorage.setItem('interviewiq_user', JSON.stringify(res.data));
        }
      } catch (err) {
        console.warn('Authentication token expired or invalid:', err);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for global 401 Unauthorized events from apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);


  const login = async (email, password) => {
    try {
      const cleanEmail = email?.trim().toLowerCase();
      const res = await apiClient.post('/auth/login', { email: cleanEmail, password });
      const { access_token, user: userData } = res.data;

      localStorage.setItem('interviewiq_token', access_token);
      localStorage.setItem('interviewiq_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: errMsg };
    }
  };

  const signup = async (fullName, email, password) => {
    try {
      const cleanEmail = email?.trim().toLowerCase();
      const res = await apiClient.post('/auth/signup', { name: fullName?.trim(), email: cleanEmail, password });
      const { access_token, user: userData } = res.data;

      localStorage.setItem('interviewiq_token', access_token);
      localStorage.setItem('interviewiq_user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.message || 'Registration failed. Email may already be in use.';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('interviewiq_token');
    localStorage.removeItem('interviewiq_user');
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
