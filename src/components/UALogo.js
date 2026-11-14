import React from 'react';
import { Image } from 'react-native';
import { logos } from '../theme/theme';
import styles from './UALogo.styles';

// Official Université Antonine logo, never stretched (contain + fixed 3.3:1 ratio)
export default function UALogo({ variant = 'blue', width = 140, style }) {
  return (
    <Image
      source={variant === 'white' ? logos.white : logos.blue}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Université Antonine"
      style={[styles.logo, { width, height: width / logos.ratio }, style]}
    />
  );
}
