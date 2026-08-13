import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (u: string, p: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (oldP: string, newP: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const login = async (u: string, p: string) => {
    const res = await authService.login(u, p);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const changePassword = async (oldP: string, newP: string) => {
    return authService.changePassword(oldP, newP);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
