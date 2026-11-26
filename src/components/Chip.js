import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import useReduceMotion from './motion/useReduceMotion';
import { MAX_FONT_SCALE } from '../theme/theme';
import { durations } from '../theme/motion';
import { createStyles } from './Chip.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';
import { Text } from 'react-native';

// Selectable pill (filters, options); optional subtitle line and count bubble.
// The selected state cross-fades (interpolateColor, 150 ms); with Reduce Motion it switches instantly.
export default function Chip({ label, selected = false, onPress, icon, disabled = false, subtitle, count, style, accessibilityLabel = label, compact = false }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, { duration: durations.short });
  }, [selected, reduceMotion]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface, colors.primary]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.border, colors.primary]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.text, colors.textOnDark]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      style={[styles.chipOuter, compact && styles.compactOuter, disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.chipInner, compact && styles.compactInner, subtitle && styles.chipTall, boxStyle]}>
        {icon ? <Ionicons name={icon} size={15} color={selected ? colors.textOnDark : colors.primary} style={styles.icon} /> : null}
        <View>
          <Animated.Text style={[styles.label, compact && styles.compactLabel, labelStyle]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {label}
          </Animated.Text>
          {subtitle ? (
            <Text style={[styles.subtitle, selected && styles.subtitleSelected]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {count ? (
          <View style={[styles.count, selected && styles.countSelected]}>
            <Text style={[styles.countText, selected && styles.countTextSelected]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {count}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}
