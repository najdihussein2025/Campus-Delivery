import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import AnimatedNumber from './motion/AnimatedNumber';
import useReduceMotion from './motion/useReduceMotion';
import { gradients, MAX_FONT_SCALE } from '../theme/theme';
import { durations, easings } from '../theme/motion';
import { formatMoney } from '../utils/money';
import { createStyles } from './WalletBanner.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING = 46;
const STROKE = 4;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RING_WINDOW_MIN = 60; // the ring is full when 60 min or more are left to order

export function formatOrderDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours} ${hours === 1 ? 'hr' : 'hrs'}${remaining ? ` ${remaining} min` : ''}`;
}

// Circular progress ring around the clock icon: time left before the order-by time (updates with the minute),
// amber when ≤ 5 min are left. Animates strokeDashoffset on the UI thread.
function CountdownRing({ minutesLeft, children }) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const target = Math.min(1, Math.max(0, minutesLeft / RING_WINDOW_MIN));
  const progress = useSharedValue(target);
  useEffect(() => {
    progress.value = reduceMotion ? target : withTiming(target, { duration: durations.long, easing: easings.emphasizedDecel });
  }, [target, reduceMotion]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));
  const warn = minutesLeft <= 5;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING / 2} cy={RING / 2} r={RADIUS} stroke="rgba(255,255,255,0.18)" strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={RING / 2}
          cy={RING / 2}
          r={RADIUS}
          stroke={warn ? colors.accentWarm : colors.accent}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}

export default function WalletBanner({ nextSlot, minutesUntilStart, ongoing, balance, onTopUp, opensText, closedInfo }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const showRing = !closedInfo && nextSlot && typeof minutesUntilStart === 'number';
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>{closedInfo ? 'University closed' : 'Next Available Delivery Slot'}</Text>
          <Text style={styles.slot} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {closedInfo?.reason || (nextSlot ? `${nextSlot.start}–${nextSlot.end}` : 'No more delivery slots today')}
          </Text>
          <Text style={styles.countdown} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {!closedInfo && nextSlot
              ? ongoing ? 'Break in progress. Ordering available' : `Starts in ${formatOrderDuration(minutesUntilStart)}`
              : `Ordering opens ${closedInfo?.opensText || opensText}`}
          </Text>
        </View>
        {showRing ? (
          <CountdownRing minutesLeft={minutesUntilStart}>
            <Ionicons name="time" size={20} color={minutesUntilStart <= 5 ? colors.accentWarm : colors.accent} />
          </CountdownRing>
        ) : (
          <View style={styles.clock}>
            <Ionicons name="time" size={22} color={colors.accent} />
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet" size={17} color={colors.primaryDark} />
        </View>
        <View style={styles.walletAmount}>
          <Text style={styles.walletLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Wallet</Text>
          <AnimatedNumber value={balance} format={formatMoney} style={styles.balance} />
        </View>
        <PressableScale onPress={onTopUp} haptic accessibilityLabel="Top up wallet" style={styles.pill}>
          <Ionicons name="add" size={16} color={colors.primaryDark} />
          <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Top up</Text>
        </PressableScale>
      </View>

    </LinearGradient>
  );
}
