'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

export type UserRole = 'BORROWER' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
  isBreEligible?: boolean;
  breRejectionReason?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  seedDatabase: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const storedToken = localStorage.getItem('creditsea_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      setToken(storedToken);
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        setUser({
          id: res.data.user._id || res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          pan: res.data.user.pan,
          dob: res.data.user.dob,
          monthlySalary: res.data.user.monthlySalary,
          employmentMode: res.data.user.employmentMode,
          isBreEligible: res.data.user.isBreEligible,
          breRejectionReason: res.data.user.breRejectionReason,
        });
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('creditsea_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string = 'Password123!') => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('creditsea_token', newToken);
      setToken(newToken);
      const formattedUser: UserProfile = {
        id: userData.id || userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        pan: userData.pan,
        dob: userData.dob,
        monthlySalary: userData.monthlySalary,
        employmentMode: userData.employmentMode,
        isBreEligible: userData.isBreEligible,
        breRejectionReason: userData.breRejectionReason,
      };
      setUser(formattedUser);
      setIsLoading(false);
      return formattedUser;
    } catch (err: any) {
      setIsLoading(false);
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('creditsea_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  const seedDatabase = async () => {
    const res = await api.post('/seed');
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, seedDatabase }}>
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
