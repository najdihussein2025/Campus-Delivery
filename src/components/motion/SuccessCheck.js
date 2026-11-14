import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useReduceMotion from './useReduceMotion';
import { createStyles } from './SuccessCheck.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

// Success moment: the circle springs in, then the check icon pops (Animated.sequence)
export default function SuccessCheck({ size = 96, color }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const fillColor = color || colors.successSolid;
  const reduceMotion = useReduceMotion();
  const circle = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const check = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.sequence([
      Animated.spring(circle, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      Animated.spring(check, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 14 }),
    ]).start();
  }, []);

  return (
    <View style={[styles.wrapper, { width: size * 1.4, height: size * 1.4 }]}>
      <Animated.View
        style={[
          styles.halo,
          { width: size * 1.4, height: size * 1.4, borderRadius: size * 0.7, backgroundColor: fillColor, opacity: 0.12 },
          { transform: [{ scale: circle }] },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: fillColor },
          { transform: [{ scale: circle }] },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: check }] }}>
          <Ionicons name="checkmark" size={size * 0.55} color={colors.textOnDark} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
