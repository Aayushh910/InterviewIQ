import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  signup: () => {},
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
    return localStorage.getItem('interviewiq_auth') === 'true';
  });

  const login = (email, password) => {
    let userData;
    if (email === 'admin@interviewiq.ai' && password === 'Admin@123') {
      userData = {
        name: 'Admin User',
        email: 'admin@interviewiq.ai',
        role: 'Platform Administrator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAdmin: true,
      };
    } else {
      const rawName = email ? email.split('@')[0] : 'Alex Rivera';
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      userData = {
        name: formattedName || 'Alex Rivera',
        email: email || 'candidate@interviewiq.ai',
        role: 'Senior Full-Stack Candidate',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAdmin: false,
      };
    }

    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('interviewiq_user', JSON.stringify(userData));
    localStorage.setItem('interviewiq_auth', 'true');
    return { success: true, user: userData };
  };

  const signup = (fullName, email) => {
    const userData = {
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
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
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
