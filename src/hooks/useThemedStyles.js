import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';

// Runs a `createStyles(colors)` factory once per palette, so styles follow light / dark mode
export default function useThemedStyles(factory) {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
