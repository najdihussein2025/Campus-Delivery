import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PulseDot from './motion/PulseDot';
import useReduceMotion from './motion/useReduceMotion';
import { MAX_FONT_SCALE } from '../theme/theme';
import { STATUS_STEPS } from '../utils/orderStatus';
import { formatTime } from '../utils/time';
import { createStyles } from './StatusTimeline.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const STEP_ICONS = ['receipt', 'restaurant', 'bicycle', 'checkmark-done'];

// One connector line that fills (Animated.timing) when the order reaches the next step
function Connector({ filled }) {
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const fill = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: filled ? 1 : 0,
      duration: reduceMotion ? 0 : 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [filled]);

  return (
    <View style={styles.line}>
      <Animated.View style={[styles.lineFill, { transform: [{ scaleY: fill }] }]} />
    </View>
  );
}

// Vertical order timeline: done = UA blue, current = cyan ring with a pulse, future = muted
export default function StatusTimeline({ currentIndex = 0, stepTimes = [], cancelled = false }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View>
      {STATUS_STEPS.map((step, i) => {
        const done = !cancelled && i < currentIndex;
        const current = !cancelled && i === currentIndex;
        const reached = done || current;
        const isLast = i === STATUS_STEPS.length - 1;
        const finished = current && isLast;
        const iconColor = done || finished ? colors.textOnDark : current ? colors.primary : colors.textMuted;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.circle, (done || finished) && styles.circleDone, current && !finished && styles.circleCurrent]}>
                <Ionicons name={STEP_ICONS[i]} size={18} color={iconColor} />
                {current && !finished ? <PulseDot color={colors.accent} size={9} style={styles.pulse} /> : null}
              </View>
              {!isLast ? <Connector filled={!cancelled && i < currentIndex} /> : null}
            </View>
            <View style={styles.textBox}>
              <Text style={[styles.step, !reached && styles.stepMuted]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{step}</Text>
              <Text style={[styles.time, current && !finished && styles.timeCurrent]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {reached && stepTimes[i] ? formatTime(new Date(stepTimes[i])) : 'Pending'}
                {current && !finished ? ' · In progress' : ''}
              </Text>
            </View>
          </View>
        );
      })}
      {cancelled ? (
        <View style={styles.cancelRow}>
          <Ionicons name="close-circle" size={20} color={colors.dangerText} />
          <Text style={styles.cancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Order cancelled</Text>
        </View>
      ) : null}
    </View>
  );
}
