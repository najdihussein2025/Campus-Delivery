import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import PressableScale from './motion/PressableScale';
import useReduceMotion from './motion/useReduceMotion';
import { MAX_FONT_SCALE } from '../theme/theme';
import { durations, easings, springs } from '../theme/motion';
import { createStyles } from './StepIndicator.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Step circle: pops (scale 0.8 → 1, bouncy spring) when the step completes and the check mark draws in
function StepCircle({ done, active, number }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const draw = useSharedValue(done ? 1 : 0);
  const first = React.useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (done && !reduceMotion) {
      scale.value = 0.8;
      scale.value = withSpring(1, springs.bouncy);
      draw.value = 0;
      draw.value = withTiming(1, { duration: durations.medium, easing: easings.emphasizedDecel });
    } else {
      draw.value = done ? 1 : 0;
    }
  }, [done]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: 20 * (1 - draw.value) }));

  return (
    <Animated.View style={[styles.circle, done && styles.circleDone, active && !done && styles.circleActive, popStyle]}>
      {done ? (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <AnimatedPath
            d="M5.5 12.8 L10 17.2 L18.5 7.8"
            fill="none"
            stroke={colors.textOnDark}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={20}
            animatedProps={pathProps}
          />
        </Svg>
      ) : (
        <Text style={[styles.number, active && styles.numberActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {number}
        </Text>
      )}
    </Animated.View>
  );
}

// Connector line: fills left → right (scaleX from the left edge) when the step before it is complete
function Connector({ done }) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const fill = useSharedValue(done ? 1 : 0);
  useEffect(() => {
    fill.value = reduceMotion ? (done ? 1 : 0) : withTiming(done ? 1 : 0, { duration: durations.long, easing: easings.standard });
  }, [done, reduceMotion]);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }], transformOrigin: 'left center' }));
  return (
    <View style={styles.connector}>
      <Animated.View style={[styles.connectorFill, fillStyle]} />
    </View>
  );
}

// Horizontal stepper (e.g. Where → When → Pay): ✓ when complete, UA blue for the current step
export default function StepIndicator({ steps = [], current = 0, completed = [], onStepPress, style }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.row, style]}>
      {steps.map((step, i) => {
        const done = Boolean(completed[i]);
        const active = i === current;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={step}>
            <PressableScale
              onPress={() => onStepPress && onStepPress(i)}
              disabled={!onStepPress}
              accessibilityLabel={`Step ${i + 1}, ${step}${done ? ', complete' : ''}`}
              accessibilityState={{ selected: active }}
              style={styles.step}
            >
              <StepCircle done={done} active={active} number={i + 1} />
              <Text style={[styles.label, (active || done) && styles.labelActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {step}
              </Text>
            </PressableScale>
            {!isLast ? <Connector done={done} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}
