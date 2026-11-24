import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { ApiError, clearAuth, fetchProfile, persistAuth, type AuthData, type AuthUser } from '@/utils/api';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  saveStoredUser,
} from '@/utils/session-storage';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  startupError: string | null;
  isSplashVisible: boolean;
  splashMessage: string;
  showSplash: (message?: string) => void;
  hideSplash: () => void;
  login: (data: AuthData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);

  // Splash loading screen state
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [splashMessage, setSplashMessage] = useState('Menyiapkan pengalamanmu...');

  const showSplash = useCallback((message = 'Menyiapkan pengalamanmu...') => {
    setSplashMessage(message);
    setIsSplashVisible(true);
  }, []);

  const hideSplash = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  useEffect(() => {
    let active = true;
    const startTime = Date.now();

    async function restoreSession() {
      try {
        const [token, storedUser] = await Promise.all([getStoredToken(), getStoredUser()]);
        if (!token || !storedUser) {
          await clearSession();
          return;
        }

        if (storedUser.role !== 'pelanggan') {
          await clearSession();
          return;
        }
        if (active) setUser(storedUser);

        try {
          const currentUser = await fetchProfile();
          if (currentUser.role !== 'pelanggan') {
            await clearSession();
            if (active) setUser(null);
          } else {
            await saveStoredUser(currentUser);
            if (active) setUser(currentUser);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            await clearSession();
            if (active) setUser(null);
          } else if (active) {
            setStartupError(
              error instanceof Error ? error.message : 'Sesi tersimpan belum dapat diperiksa.'
            );
          }
        }
      } catch (error) {
        if (active) {
          setStartupError(
            error instanceof Error ? error.message : 'Sesi tersimpan gagal dibaca.'
          );
        }
      } finally {
        // Biarkan splash screen tampil minimal 1.5 detik agar terlihat jelas oleh user
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1500 - elapsed);
        setTimeout(() => {
          if (active) {
            setIsLoading(false);
            setIsSplashVisible(false);
          }
        }, remaining);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (data: AuthData) => {
    if (data.role !== 'pelanggan') {
      throw new Error('Aplikasi ini hanya untuk akun pelanggan.');
    }
    await persistAuth(data);
    const { token: _token, ...userData } = data;
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updatedUser: AuthUser) => {
    await saveStoredUser(updatedUser);
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      startupError,
      isSplashVisible,
      splashMessage,
      showSplash,
      hideSplash,
      login,
      logout,
      updateUser,
    }),
    [user, isLoading, startupError, isSplashVisible, splashMessage, showSplash, hideSplash, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus dipakai di dalam AuthProvider.');
  return context;
}
