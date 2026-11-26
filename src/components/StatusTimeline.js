import React, { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import PulseDot from './motion/PulseDot';
import useReduceMotion from './motion/useReduceMotion';
import { MAX_FONT_SCALE } from '../theme/theme';
import { STATUS_STEPS } from '../utils/orderStatus';
import { createStyles } from './StatusTimeline.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const STEP_ICONS = ['receipt', 'restaurant', 'bicycle', 'checkmark-done'];

// Same four steps as STATUS_STEPS (the status keys stay unchanged); only the displayed label of the last one changes
const STEPS = STATUS_STEPS.map((step, i) => ({ step, index: i, icon: STEP_ICONS[i] }));

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

// Step icon: pops (scale 0.7 → 1, bouncy spring) when its step is newly reached
function PopCircle({ reached, style, children }) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reached && !reduceMotion) {
      scale.value = 0.7;
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    }
  }, [reached]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Reanimated.View style={[style, animated]}>{children}</Reanimated.View>;
}

// Vertical order timeline: done = UA blue, current = cyan ring with a pulse, future = muted.
export default function StatusTimeline({ currentIndex = 0, recordedTimes = [], preparationIcon, deliveryLocation, cancelled = false, cancelledTime }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const renderStep = ({ item }) => {
    const { step, index: i, icon } = item;
    const isLast = i === STEPS.length - 1;
    const done = cancelled ? i === 0 : i < currentIndex;
    const current = !cancelled && i === currentIndex && !isLast;
    const finished = !cancelled && i === currentIndex && isLast;
    const reached = done || current || finished;
    const iconColor = done || finished ? colors.textOnDark : current ? colors.primary : colors.textMuted;
    const timeText = [cancelled && !done ? 'Skipped' : current ? 'In progress' : reached ? 'Completed' : 'Pending',
      reached ? recordedTimes[i] : null].filter(Boolean).join(' · ');

    return (
      <View key={step} style={styles.row}>
        <View style={styles.rail}>
          <PopCircle reached={reached} style={[styles.circle, (done || finished) && styles.circleDone, current && !finished && styles.circleCurrent]}>
            <Ionicons name={i === 1 && preparationIcon ? preparationIcon : icon} size={18} color={iconColor} />
            {current && !finished ? <PulseDot color={colors.accent} size={9} style={styles.pulse} /> : null}
          </PopCircle>
          {!isLast ? <Connector filled={!cancelled && i < currentIndex} /> : null}
        </View>
        <View style={styles.textBox}>
          <Text style={[styles.step, !reached && styles.stepMuted]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{isLast && deliveryLocation ? 'Delivered to ' + deliveryLocation : step}</Text>
          <Text style={[styles.time, current && !finished && styles.timeCurrent]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {timeText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View>
      <FlatList data={STEPS} keyExtractor={(item) => item.step} renderItem={renderStep} scrollEnabled={false} />
      {cancelled ? (
        <View style={styles.cancelRow}>
          <Ionicons name="close-circle" size={20} color={colors.dangerText} />
          <Text style={styles.cancelText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {cancelledTime ? `Order cancelled · ${cancelledTime}` : 'Order cancelled'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
