'use client';

import React, { createContext, useContext, useSyncExternalStore, useCallback } from 'react';
import type { User } from '@/types/auth';
import { authService, type AuthResult } from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  loginDemo: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  loginDemo: async () => ({ id: '', name: '', email: '', createdAt: '' }),
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(
    authService.subscribe,
    authService.getSnapshot,
    authService.getServerSnapshot,
  );

  const login = useCallback((email: string, pass: string) => {
    return authService.login(email, pass);
  }, []);

  const register = useCallback((name: string, email: string, pass: string) => {
    return authService.register(name, email, pass);
  }, []);

  const loginDemo = useCallback(() => {
    return authService.loginDemo();
  }, []);

  const logout = useCallback(() => {
    return authService.logout();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
