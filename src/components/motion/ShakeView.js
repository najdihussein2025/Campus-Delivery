import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated } from 'react-native';
import { error as errorHaptic } from '../../utils/haptics';
import useReduceMotion from './useReduceMotion';

// Wrap a form and call ref.current.shake() when submit fails: horizontal shake + error haptic
const ShakeView = forwardRef(function ShakeView({ style, children }, ref) {
  const reduceMotion = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    shake: () => {
      errorHaptic();
      if (reduceMotion) return;
      const step = (toValue) => Animated.timing(x, { toValue, duration: 55, useNativeDriver: true });
      Animated.sequence([step(-8), step(8), step(-6), step(6), step(0)]).start();
    },
  }));

  return <Animated.View style={[style, { transform: [{ translateX: x }] }]}>{children}</Animated.View>;
});

export default ShakeView;
