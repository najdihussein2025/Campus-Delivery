import React from 'react';
import { Text, View } from 'react-native';
import PulseDot from './motion/PulseDot';
import { colors, MAX_FONT_SCALE } from '../theme/theme';
import styles from './Badge.styles';

const STATUS_VARIANTS = {
  Received: 'info',
  Preparing: 'warning',
  'On the way': 'accent',
  Delivered: 'open',
  Cancelled: 'closed',
};

// Pill label with text + dot (never colour alone); "open" pulses to show it's live
export default function Badge({ label, variant = 'neutral', status, style }) {
  const key = status ? STATUS_VARIANTS[status] || 'neutral' : variant;
  return (
    <View style={[styles.badge, styles[key], style]}>
      {key === 'open' && !status ? (
        <PulseDot color={colors.success} size={6} style={styles.pulse} />
      ) : (
        <View style={[styles.dot, styles[`${key}Dot`]]} />
      )}
      <Text style={[styles.text, styles[`${key}Text`]]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {label || status}
      </Text>
    </View>
  );
}
