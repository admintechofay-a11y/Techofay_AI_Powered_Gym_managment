import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  branchIds: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  activeBranchId: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  setActiveBranchId: (branchId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gymos_access_token'));
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(() => localStorage.getItem('gymos_active_branch'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem('gymos_user');
    if (rawUser && token) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        localStorage.removeItem('gymos_user');
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = (accessToken: string, refreshToken: string, userData: AuthUser) => {
    localStorage.setItem('gymos_access_token', accessToken);
    localStorage.setItem('gymos_refresh_token', refreshToken);
    localStorage.setItem('gymos_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    if (userData.branchIds?.length && !activeBranchId) {
      setActiveBranchId(userData.branchIds[0]);
    }
  };

  const logout = () => {
    localStorage.removeItem('gymos_access_token');
    localStorage.removeItem('gymos_refresh_token');
    localStorage.removeItem('gymos_user');
    setToken(null);
    setUser(null);
  };

  const setActiveBranchId = (branchId: string) => {
    localStorage.setItem('gymos_active_branch', branchId);
    setActiveBranchIdState(branchId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeBranchId,
        isLoading,
        login,
        logout,
        setActiveBranchId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
