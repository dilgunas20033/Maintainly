import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette as lightPalette } from './theme';

type Mode = 'light' | 'dark';

interface ThemeTokens {
  mode: Mode;
  colors: typeof lightPalette & { backgroundElevated: string };
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeTokens | undefined>(undefined);
const STORAGE_KEY = 'maintainly.theme.mode';

const darkPalette = {
  ...lightPalette,
  primary: '#4db9ff',
  primaryDark: '#1c6fa0',
  bg: '#121212',
  bgAlt: '#1e1e1e',
  text: '#e6eef2',
  textDim: '#9aa8b0',
  border: '#2e3d44',
  danger: '#ff6b60',
  warn: '#f5c169',
  info: '#6ec8e6',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') setMode(stored);
      } catch {} finally { setReady(true); }
    })();
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const colors = mode === 'dark' ? { ...darkPalette, backgroundElevated: '#1e1e1e' } : { ...lightPalette, backgroundElevated: '#e5f7ff' };

  if (!ready) return null; // Optional splash placeholder could go here

  return (
    <ThemeCtx.Provider value={{ mode, colors, toggle }}>{children}</ThemeCtx.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}
