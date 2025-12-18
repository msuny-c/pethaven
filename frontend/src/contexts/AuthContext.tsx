import React, { useEffect, useState, createContext, useContext } from 'react';
import { AuthUser } from '../types';
import { login as apiLogin } from '../services/api';
interface AuthContextType {
  user: AuthUser | null;
  primaryRole?: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  isAuthenticated: boolean;
  authenticate: (user: AuthUser) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('petHavenUser');
    if (!storedUser) return null;
    const parsed = JSON.parse(storedUser) as AuthUser & { userId?: number; token?: string };
    return {
      ...parsed,
      id: parsed.id || parsed.userId || 0,
      accessToken: parsed.accessToken || parsed.token || '',
      refreshToken: parsed.refreshToken || ''
    };
  });
  const primaryRole = user?.roles?.[0];
  const login = async (email: string, password: string) => {
    try {
      const response = await apiLogin(email, password);
      setAndStoreUser(response);
      return true;
    } catch (e) {
      return false;
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('petHavenUser');
  };
  const updateUser = (data: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...data };
      localStorage.setItem('petHavenUser', JSON.stringify(next));
      return next;
    });
  };
  const setAndStoreUser = (u: AuthUser) => {
    setUser(u);
    localStorage.setItem('petHavenUser', JSON.stringify(u));
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'petHavenUser' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as AuthUser;
          setUser(parsed);
        } catch {
          // ignore
        }
      }
    };
    const handleRefresh = (e: Event) => {
      const detail = (e as CustomEvent<AuthUser>).detail;
      if (detail) {
        setUser(detail);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:refreshed', handleRefresh as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:refreshed', handleRefresh as EventListener);
    };
  }, []);

  return <AuthContext.Provider value={{
    user,
    primaryRole,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    authenticate: setAndStoreUser
  }}>
      {children}
    </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
