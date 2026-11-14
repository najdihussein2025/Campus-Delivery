import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import useReduceMotion from './useReduceMotion';
import { createStyles } from './PulseDot.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

// "Live" indicator: a solid dot with a ring that grows and fades forever (Animated.loop)
export default function PulseDot({ color, size = 8, style }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const dotColor = color || colors.success;
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const box = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.wrapper, box, style]}>
      {!reduceMotion ? (
        <Animated.View
          style={[styles.ring, box, { backgroundColor: dotColor, opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
      ) : null}
      <View style={[box, { backgroundColor: dotColor }]} />
    </View>
  );
}
