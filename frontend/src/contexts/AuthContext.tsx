import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, refreshAccessToken, setAccessToken, setAuthExpiredHandler } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const queryClient = useQueryClient();

  const clearSession = () => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  useEffect(() => {
    setAuthExpiredHandler(clearSession);
    return () => setAuthExpiredHandler(null);
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const restoredToken = await refreshAccessToken();
        const { data } = await api.get<User>('/auth/me');

        if (mounted) {
          setToken(restoredToken);
          setUser(data);
        }
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }

  async function register(payload: { name: string; email: string; password: string }) {
    const { data } = await api.post<{ user: User; accessToken: string }>('/auth/register', payload);
    setAccessToken(data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {});
    } finally {
      clearSession();
    }
  }

  const value = useMemo(
    () => ({ user, accessToken: token, initializing, login, register, logout }),
    [user, token, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
