import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@haimish/shared';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email?: string; phone?: string; password: string; name?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendOTP: (identifier: string, type: 'register' | 'login' | 'verify') => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (identifier: string, code: string, type: 'register' | 'login' | 'verify') => Promise<{ success: boolean; error?: string; user?: User }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetchAPI<{ user: User | null }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const data = await fetchAPI<{ success: boolean; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (data: { email?: string; phone?: string; password: string; name?: string }) => {
    try {
      const result = await fetchAPI<{ success: boolean; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(result.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const sendOTP = async (identifier: string, type: 'register' | 'login' | 'verify') => {
    try {
      await fetchAPI('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ identifier, type }),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const verifyOTP = async (identifier: string, code: string, type: 'register' | 'login' | 'verify') => {
    try {
      const data = await fetchAPI<{ success: boolean; user?: User }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ identifier, code, type }),
      });
      if (data.user) {
        setUser(data.user);
      }
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      sendOTP,
      verifyOTP,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}