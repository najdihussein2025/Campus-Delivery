import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { MAX_FONT_SCALE } from '../../theme/theme';
import useReduceMotion from './useReduceMotion';
import { createStyles } from './BumpBadge.styles';
import useThemedStyles from '../../hooks/useThemedStyles';

// Count pill that "bumps" (1 → 1.35 → 1) whenever its value changes; hidden when the value is 0
export default function BumpBadge({ value, style, textStyle }) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion || !value) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }),
    ]).start();
  }, [value]);

  if (!value) return null;

  return (
    <Animated.View style={[styles.badge, style, { transform: [{ scale }] }]}>
      <Animated.Text style={[styles.text, textStyle]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {value > 99 ? '99+' : value}
      </Animated.Text>
    </Animated.View>
  );
}
