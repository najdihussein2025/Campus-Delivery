import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import AnimatedNumber from './motion/AnimatedNumber';
import useReduceMotion from './motion/useReduceMotion';
import { gradients, MAX_FONT_SCALE } from '../theme/theme';
import { durations, easings, springs, REDUCED_FADE_MS } from '../theme/motion';
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

// "University closed" emoji: drops in once (no looping motion on closed days); Reduce Motion: a short fade
function DropEmoji({ emoji, style }) {
  const reduceMotion = useReduceMotion();
  const y = useSharedValue(reduceMotion ? 0 : -18);
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: reduceMotion ? REDUCED_FADE_MS : durations.medium });
    if (!reduceMotion) y.value = withSpring(0, springs.bouncy);
  }, []);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  return <Animated.Text style={[style, animated]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{emoji}</Animated.Text>;
}

// Home hero: next class break (countdown ring), wallet balance (rolling number) + Top up, and a compact coffee-stamp chip
export default function WalletBanner({
  nextSlot, minutesLeft, missedNote, balance, onTopUp, emptyText, closedInfo, stamps, onStamps,
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const showRing = !closedInfo && nextSlot && typeof minutesLeft === 'number';
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>{closedInfo ? 'University closed' : 'Next break'}</Text>
          {closedInfo ? (
            <>
              <View style={styles.closedRow}>
                <DropEmoji emoji={closedInfo.emoji} style={styles.closedEmoji} />
                <Text style={[styles.slot, styles.slotNone, styles.flex]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{closedInfo.reason}</Text>
              </View>
              {closedInfo.opensText ? (
                <Text style={styles.countdown} maxFontSizeMultiplier={MAX_FONT_SCALE}>Ordering opens {closedInfo.opensText}</Text>
              ) : null}
            </>
          ) : nextSlot ? (
            <>
              <Text style={styles.slot} maxFontSizeMultiplier={MAX_FONT_SCALE}>{nextSlot.label}</Text>
              {typeof minutesLeft === 'number' ? (
                <Text style={styles.countdown} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {minutesLeft > 0 ? (
                    <>
                      Order in the next <Text style={styles.countdownStrong}>{minutesLeft} min</Text> to make it
                    </>
                  ) : (
                    'Order now – last minute for this break'
                  )}
                </Text>
              ) : null}
              {missedNote ? <Text style={styles.missed} maxFontSizeMultiplier={MAX_FONT_SCALE}>{missedNote}</Text> : null}
            </>
          ) : (
            <Text style={[styles.slot, styles.slotNone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {emptyText || 'No more breaks today'}
            </Text>
          )}
        </View>
        {showRing ? (
          <CountdownRing minutesLeft={minutesLeft}>
            <Ionicons name="time" size={20} color={minutesLeft <= 5 ? colors.accentWarm : colors.accent} />
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
        <Text style={styles.walletLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Wallet</Text>
        <AnimatedNumber value={balance} format={formatMoney} style={styles.balance} />
        <PressableScale onPress={onTopUp} haptic accessibilityLabel="Top up wallet" style={styles.pill}>
          <Ionicons name="add" size={16} color={colors.primaryDark} />
          <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Top up</Text>
        </PressableScale>
      </View>

      {stamps ? (
        <PressableScale
          onPress={onStamps}
          style={styles.stampChip}
          accessibilityLabel={stamps.rewards > 0 ? 'Coffee stamps, you have a free coffee' : `Coffee stamps, ${stamps.stamps} of 10`}
        >
          <Text style={styles.stampText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {stamps.rewards > 0 ? '🎁 Free coffee ready' : `☕ ${stamps.stamps}/10 · ${10 - stamps.stamps} to go`}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
        </PressableScale>
      ) : null}
    </LinearGradient>
  );
}
