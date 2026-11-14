import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import useReduceMotion from './useReduceMotion';

// Entrance animation: fades in and slides up `offset` px on mount (Animated.timing, ease-out)
export default function FadeInView({ delay = 0, duration = 320, offset = 16, style, children }) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });

  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
