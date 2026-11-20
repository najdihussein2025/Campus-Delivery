import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BumpBadge from '../components/motion/BumpBadge';
import { FlyTarget } from '../components/motion/FlyToBag';
import useReduceMotion from '../components/motion/useReduceMotion';
import { springs } from '../theme/motion';
import { createStyles } from './TabIcon.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// Tab bar icon: bounces (translateY -3 → 0, bouncy spring) when its tab becomes active; optional bumping badge (cart
// count). The Bag icon is also a landing spot for the fly-to-bag animation. The sliding indicator lives in MainTabs.
export default function TabIcon({ name, focused, color, size, badge, flyTarget = false }) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!focused || reduceMotion) return;
    lift.value = withSequence(withTiming(-3, { duration: 90 }), withSpring(0, springs.bouncy));
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }] }));
  const icon = (
    <Animated.View style={iconStyle}>
      <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
    </Animated.View>
  );

  return (
    <View style={styles.wrapper}>
      {flyTarget ? <FlyTarget>{icon}</FlyTarget> : icon}
      <BumpBadge value={badge} style={styles.badge} />
    </View>
  );
}
