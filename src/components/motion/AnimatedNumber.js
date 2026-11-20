import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { durations, easings } from '../../theme/motion';
import useReduceMotion from './useReduceMotion';

// Number that rolls from its old value to the new one (~400 ms, emphasizedDecel). `value` is a number (cents for
// money), `format` turns it into text (callers pass formatMoney). Reduce Motion: the value just swaps.
export default function AnimatedNumber({ value, format = String, style, duration = durations.long, prefix = '', suffix = '' }) {
  const reduceMotion = useReduceMotion();
  const formatRef = useRef(format);
  formatRef.current = format;
  const [text, setText] = useState(format(value));
  const shared = useSharedValue(value);

  const show = (v) => setText(formatRef.current(Math.round(v)));

  useAnimatedReaction(
    () => shared.value,
    (current, previous) => {
      if (current !== previous) runOnJS(show)(current);
    },
    []
  );

  useEffect(() => {
    if (reduceMotion) shared.value = value;
    else shared.value = withTiming(value, { duration, easing: easings.emphasizedDecel });
  }, [value, reduceMotion]);

  return (
    <Text style={style} maxFontSizeMultiplier={MAX_FONT_SCALE} accessibilityLabel={`${prefix}${format(value)}${suffix}`}>
      {prefix}{text}{suffix}
    </Text>
  );
}
