import React from 'react';
import { Image } from 'react-native';
import { logos } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { createStyles } from './UALogo.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// Official Université Antonine logo, never stretched (contain + fixed 3.3:1 ratio); white version on dark backgrounds
export default function UALogo({ variant = 'blue', width = 140, style }) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const useWhite = variant === 'white' || isDark;
  return (
    <Image
      source={useWhite ? logos.white : logos.blue}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Université Antonine"
      style={[styles.logo, { width, height: width / logos.ratio }, style]}
    />
  );
}
