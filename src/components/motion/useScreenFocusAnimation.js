import { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import useReduceMotion from './useReduceMotion';

// Replays a fade + slide entrance every time the screen gets focus (React Navigation useFocusEffect)
export default function useScreenFocusAnimation() {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (reduceMotion) {
        progress.setValue(1);
        return undefined;
      }
      progress.setValue(0);
      const animation = Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [reduceMotion])
  );

  const animatedStyle = {
    flex: 1,
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  return { animatedStyle };
}
