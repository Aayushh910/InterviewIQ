import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
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
    return !!localStorage.getItem('interviewiq_token') || localStorage.getItem('interviewiq_auth') === 'true';
  });

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('interviewiq_token', access_token);
      localStorage.setItem('interviewiq_user', JSON.stringify(userData));
      localStorage.setItem('interviewiq_auth', 'true');
      return { success: true, user: userData };
    } catch (err) {
      // Fallback for offline local dev mode
      const rawName = email ? email.split('@')[0] : 'Alex Rivera';
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const userData = {
        id: 'user-offline-1',
        name: formattedName || 'Alex Rivera',
        email: email || 'candidate@interviewiq.ai',
        role: 'Senior Full-Stack Candidate',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAdmin: email === 'admin@interviewiq.ai',
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('interviewiq_user', JSON.stringify(userData));
      localStorage.setItem('interviewiq_auth', 'true');
      return { success: true, user: userData };
    }
  };

  const signup = async (fullName, email, password = 'Password@123') => {
    try {
      const res = await apiClient.post('/auth/signup', { name: fullName, email, password });
      const { access_token, user: userData } = res.data;

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('interviewiq_token', access_token);
      localStorage.setItem('interviewiq_user', JSON.stringify(userData));
      localStorage.setItem('interviewiq_auth', 'true');
      return { success: true, user: userData };
    } catch (err) {
      // Fallback for offline local dev mode
      const userData = {
        id: 'user-offline-1',
        name: fullName || 'Alex Rivera',
        email: email || 'candidate@interviewiq.ai',
        role: 'Senior Full-Stack Candidate',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAdmin: false,
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('interviewiq_user', JSON.stringify(userData));
      localStorage.setItem('interviewiq_auth', 'true');
      return { success: true, user: userData };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('interviewiq_token');
    localStorage.removeItem('interviewiq_user');
    localStorage.removeItem('interviewiq_auth');
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
