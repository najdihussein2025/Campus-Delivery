import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import useReduceMotion from './useReduceMotion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Small circular progress ring (react-native-svg, strokeDashoffset on the UI thread). `progress` 0..1 fills it;
// `linearMs` makes it glide linearly to the new value (used to DRAIN a ring second by second). Children sit in the middle.
export default function ProgressRing({ size = 28, stroke = 3, progress = 0, color = '#00AEEF', trackColor = 'rgba(255,255,255,0.2)', linearMs = 0, children }) {
  const reduceMotion = useReduceMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = useSharedValue(progress);
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    value.value = reduceMotion ? clamped : withTiming(clamped, { duration: linearMs || 400, easing: linearMs ? Easing.linear : Easing.out(Easing.cubic) });
  }, [progress, reduceMotion, linearMs]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - value.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}
