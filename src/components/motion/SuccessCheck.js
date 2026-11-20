import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import useReduceMotion from './useReduceMotion';
import { durations, easings, springs, REDUCED_FADE_MS } from '../../theme/motion';
import { createStyles } from './SuccessCheck.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_LENGTH = 26;

function Ripple({ size, color, delay, reduceMotion }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!reduceMotion) p.value = withDelay(delay, withTiming(1, { duration: durations.extraLong, easing: easings.standard }));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - p.value) * (p.value > 0 ? 1 : 0), transform: [{ scale: 1 + p.value * 0.9 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: color }, style]} />;
}

// Success moment: a ring grows in (spring), the check mark DRAWS its stroke (strokeDashoffset) and two ripple rings
// spread out once. Reduce Motion: a short fade, the check is drawn at once.
export default function SuccessCheck({ size = 96, color }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const fillColor = color || colors.successSolid;
  const reduceMotion = useReduceMotion();
  const ring = useSharedValue(reduceMotion ? 1 : 0);
  const draw = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      ring.value = withTiming(1, { duration: REDUCED_FADE_MS });
      draw.value = 1;
      return;
    }
    ring.value = withSpring(1, springs.bouncy);
    draw.value = withDelay(260, withTiming(1, { duration: 340, easing: easings.emphasizedDecel }));
  }, []);

  const ringStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, ring.value * 2), transform: [{ scale: 0.6 + 0.4 * ring.value }] }));
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - draw.value) }));
  const box = size * 1.4;

  return (
    <View style={[styles.wrapper, { width: box, height: box }]}>
      {!reduceMotion ? <Ripple size={size} color={fillColor} delay={200} reduceMotion={reduceMotion} /> : null}
      {!reduceMotion ? <Ripple size={size} color={fillColor} delay={420} reduceMotion={reduceMotion} /> : null}
      <Animated.View style={[styles.halo, { width: box, height: box, borderRadius: box / 2, backgroundColor: fillColor, opacity: 0.12 }, ringStyle]} />
      <Animated.View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: fillColor }, ringStyle]}>
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
          <AnimatedPath
            d="M5.5 12.8 L10 17.2 L18.5 7.8"
            fill="none"
            stroke={colors.textOnDark}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={CHECK_LENGTH}
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
