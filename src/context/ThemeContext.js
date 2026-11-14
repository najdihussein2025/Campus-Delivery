import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme/theme';
// Side effect: enables LayoutAnimation on Android
import '../components/motion/layout';

const STORAGE_KEY = 'campusgo:themeMode';
const ThemeContext = createContext(null);

// Context API + custom hook: holds System / Light / Dark and exposes the matching colour palette
export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const [mode, setModeState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch((error) => console.log('Theme read failed', error));
  }, []);

  const setMode = useCallback((next) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'));
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((error) => console.log('Theme write failed', error));
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, mode, setMode }),
    [isDark, mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
