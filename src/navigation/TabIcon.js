import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BumpBadge from '../components/motion/BumpBadge';
import useReduceMotion from '../components/motion/useReduceMotion';
import { createStyles } from './TabIcon.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// Tab bar icon: springs up when its tab becomes active; optional bumping badge (cart count)
export default function TabIcon({ name, focused, color, size, badge }) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused || reduceMotion) return;
    scale.setValue(0.8);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }).start();
  }, [focused]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
      </Animated.View>
      {focused ? <View style={[styles.indicator, { backgroundColor: color }]} /> : null}
      <BumpBadge value={badge} style={styles.badge} />
    </View>
  );
}
