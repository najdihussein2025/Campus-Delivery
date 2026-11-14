import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './StickyBar.styles';

// Bottom action bar that stays visible while the screen scrolls (one clear primary action)
export default function StickyBar({ children, style, insetBottom = true }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: (insetBottom ? insets.bottom : 0) + 12 }, style]}>{children}</View>;
}
