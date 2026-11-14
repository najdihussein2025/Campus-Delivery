import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import useReduceMotion from './useReduceMotion';
import styles from './SkeletonBlock.styles';

// Loading placeholder: a grey block with a looping opacity shimmer
export default function SkeletonBlock({ width = '100%', height = 16, radius = 8, style }) {
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  return <Animated.View style={[styles.block, { width, height, borderRadius: radius, opacity }, style]} />;
}
