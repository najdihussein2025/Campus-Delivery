import React from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fixedColors, getCategoryColors, getCategoryIcon, radius } from '../theme/theme';
import { createStyles } from './ProductImage.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// Gradient placeholder with a category icon; renders a real image when `image` is given
export default function ProductImage({ category, image, size = 120, iconSize, rounded = radius.lg, style, dimmed = false }) {
  const styles = useThemedStyles(createStyles);
  const box = [styles.box, { height: size, borderRadius: rounded }, dimmed && styles.dimmed, style];

  if (image) {
    return <Image source={image} resizeMode="cover" style={box} />;
  }
  return (
    <View style={box}>
      <LinearGradient
        colors={getCategoryColors(category)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: rounded }]}
      >
        <View style={styles.circle} />
        <Ionicons name={getCategoryIcon(category)} size={iconSize || size * 0.42} color={fixedColors.white} />
      </LinearGradient>
    </View>
  );
}
