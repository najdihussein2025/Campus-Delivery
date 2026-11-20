import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STAMPS_PER_REWARD, describeProgress } from '../utils/loyalty';
import { MAX_FONT_SCALE } from '../theme/theme';
import useReduceMotion from './motion/useReduceMotion';
import { createStyles } from './LoyaltyCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Stamps the user has already "seen" pop in, per app session, so only NEW stamps animate
let seenStamps = null;

// Stamp card: 10 circles in two rows of 5. Newly earned stamps pop in with a spring (Animated.stagger).
export default function LoyaltyCard({ stamps, rewards, style }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scales = useRef(Array.from({ length: STAMPS_PER_REWARD }, (_, i) => new Animated.Value(i < stamps ? 1 : 0))).current;

  useEffect(() => {
    const from = seenStamps === null ? 0 : Math.min(seenStamps, stamps);
    seenStamps = stamps;
    scales.forEach((value, i) => {
      if (i >= stamps) value.setValue(0);
      else if (i < from || reduceMotion) value.setValue(1);
      else value.setValue(0);
    });
    const popping = scales.slice(from, stamps);
    if (reduceMotion || popping.length === 0) return undefined;
    const animation = Animated.stagger(
      90,
      popping.map((value) => Animated.spring(value, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }))
    );
    animation.start();
    return () => animation.stop();
  }, [stamps, reduceMotion]);

  const rows = [scales.slice(0, 5), scales.slice(5, 10)];
  const text = describeProgress({ stamps, rewards });

  return (
    <View style={[styles.card, style]} accessible accessibilityLabel={`Coffee stamps. ${text}`}>
      {/* Not a FlatList: the 10-stamp grid is a fixed 2 × 5 decorative layout, not scrolling data */}
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((value, c) => {
            const index = r * 5 + c;
            const filled = index < stamps;
            return (
              <View key={index} style={[styles.slot, filled && styles.slotFilled]}>
                {!filled ? <Text style={styles.number}>{index + 1}</Text> : null}
                <Animated.View style={[styles.stamp, { opacity: value, transform: [{ scale: value }] }]}>
                  <Ionicons name="cafe" size={22} color={colors.textOnDark} />
                </Animated.View>
              </View>
            );
          })}
        </View>
      ))}
      <Text style={styles.text} maxFontSizeMultiplier={MAX_FONT_SCALE}>{text}</Text>
    </View>
  );
}
