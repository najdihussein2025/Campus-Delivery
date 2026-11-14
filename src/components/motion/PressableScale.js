import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { tap } from '../../utils/haptics';
import useReduceMotion from './useReduceMotion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Press feedback: springs down to `scaleTo` on press-in and back on release (Animated.spring)
export default function PressableScale({
  onPress,
  onLongPress,
  disabled = false,
  haptic = false,
  scaleTo = 0.96,
  style,
  children,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  const springTo = (toValue) => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  const handlePress = (event) => {
    if (haptic) tap();
    if (onPress) onPress(event);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={() => springTo(scaleTo)}
      onPressOut={() => springTo(1)}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState || { disabled }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
