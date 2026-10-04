import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pm_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifySavedUser = async () => {
      const savedToken = localStorage.getItem('pm_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data.data?.user) {
          setUser(res.data.data.user);
          localStorage.setItem('pm_user', JSON.stringify(res.data.data.user));
        }
      } catch {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySavedUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data.data) {
      const { user: loggedInUser, token: authToken } = res.data.data;
      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('pm_token', authToken);
      localStorage.setItem('pm_user', JSON.stringify(loggedInUser));
    } else {
      throw new Error(res.data?.error || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data?.success && res.data.data) {
      const { user: registeredUser, token: authToken } = res.data.data;
      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem('pm_token', authToken);
      localStorage.setItem('pm_user', JSON.stringify(registeredUser));
    } else {
      throw new Error(res.data?.error || 'Registration failed');
    }
  };

  const demoLogin = async (): Promise<void> => {
    await login('alex@freelancer.io', 'password123');
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
