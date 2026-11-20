import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { STAMPS_PER_REWARD, describeProgress } from '../utils/loyalty';
import { MAX_FONT_SCALE } from '../theme/theme';
import { durations, easings, springs } from '../theme/motion';
import { tap } from '../utils/haptics';
import useReduceMotion from './motion/useReduceMotion';
import { createStyles } from './LoyaltyCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Stamps the user has already "seen" land, per app session, so only NEW stamps animate
let seenStamps = null;

// One stamp circle. A new stamp lands like a rubber stamp: scale 1.6 → 1 with a slight rotation (-12° → 0), a quick
// burst ring (the "shadow burst") and a haptic. Reduce Motion: it just appears.
function Stamp({ filled, isNew, delay, styles, color }) {
  const reduceMotion = useReduceMotion();
  const p = useSharedValue(filled && !isNew ? 1 : 0);
  const burst = useSharedValue(0);

  useEffect(() => {
    if (!filled) {
      p.value = 0;
      return;
    }
    if (!isNew || reduceMotion) {
      p.value = 1;
      return;
    }
    p.value = withDelay(delay, withSpring(1, springs.bouncy));
    burst.value = withDelay(delay + 120, withTiming(1, { duration: durations.long, easing: easings.standard }));
    const id = setTimeout(tap, delay + 120); // haptic when it hits the card
    return () => clearTimeout(id);
  }, [filled, isNew]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 2),
    transform: [{ scale: 1.6 - 0.6 * p.value }, { rotate: `${-12 * (1 - p.value)}deg` }],
  }));
  const burstStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - burst.value) * (burst.value > 0 ? 1 : 0),
    transform: [{ scale: 1 + burst.value * 0.9 }],
  }));

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.burst, { borderColor: color }, burstStyle]} />
      <Animated.View style={[styles.stamp, stampStyle]}>
        <Ionicons name="cafe" size={22} color="#FFFFFF" />
      </Animated.View>
    </>
  );
}

// Free-coffee badge: bounces once when the card is full (a reward is waiting)
function RewardBadge({ styles }) {
  const reduceMotion = useReduceMotion();
  const s = useSharedValue(reduceMotion ? 1 : 0.6);
  useEffect(() => {
    if (!reduceMotion) s.value = withSequence(withTiming(1.25, { duration: 160 }), withSpring(1, springs.bouncy));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[styles.rewardBadge, style]}>
      <Text style={styles.rewardBadgeText}>🎁 Free coffee</Text>
    </Animated.View>
  );
}

// Stamp card: 10 circles in two rows of 5. New stamps land like a rubber stamp; at 10/10 a soft shimmer sweeps over the card.
export default function LoyaltyCard({ stamps, rewards, style }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const from = useRef(0);
  const sweep = useSharedValue(-1);
  const [cardWidth, setCardWidth] = React.useState(0);

  // Which stamps are new in this render (counted from the last value this session)
  const previous = seenStamps === null ? stamps : Math.min(seenStamps, stamps);
  from.current = previous;
  useEffect(() => {
    seenStamps = stamps;
  }, [stamps]);

  useEffect(() => {
    if (rewards > 0 && !reduceMotion && cardWidth) {
      sweep.value = -1;
      sweep.value = withDelay(300, withTiming(1.2, { duration: 1100, easing: easings.standard }));
    }
  }, [rewards, cardWidth, reduceMotion]);
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateX: sweep.value * cardWidth }] }));

  const text = describeProgress({ stamps, rewards });
  const slots = Array.from({ length: STAMPS_PER_REWARD }, (_, i) => i);
  const rows = [slots.slice(0, 5), slots.slice(5, 10)];

  return (
    <View
      style={[styles.card, style]}
      accessible
      accessibilityLabel={`Coffee stamps. ${text}`}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
    >
      {rewards > 0 ? <RewardBadge styles={styles} /> : null}
      {/* Not a FlatList: the 10-stamp grid is a fixed 2 × 5 decorative layout, not scrolling data */}
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((index) => {
            const filled = index < stamps;
            const isNew = filled && index >= from.current;
            return (
              <View key={index} style={[styles.slot, filled && styles.slotFilled]}>
                {!filled ? <Text style={styles.number}>{index + 1}</Text> : null}
                <Stamp filled={filled} isNew={isNew} delay={(index - from.current) * 140} styles={styles} color={colors.accent} />
              </View>
            );
          })}
        </View>
      ))}
      <Text style={styles.text} maxFontSizeMultiplier={MAX_FONT_SCALE}>{text}</Text>
      {rewards > 0 && !reduceMotion && cardWidth ? (
        <Animated.View pointerEvents="none" style={[styles.shimmer, { width: cardWidth * 0.5 }, sweepStyle]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
        </Animated.View>
      ) : null}
    </View>
  );
}
