import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './AppButton.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Label colour for each button variant, built from the active palette
const getTextColors = (colors) => ({
  primary: colors.textOnDark,
  secondary: colors.primaryText,
  ghost: colors.primaryText,
  danger: colors.textOnDark,
  accent: colors.primaryDark,
  dangerOutline: colors.dangerText,
});

const HAPTIC_VARIANTS = ['primary', 'accent', 'danger'];

// Reusable button (variant, icon, loading, disabled + reason) with spring press feedback and haptics
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  small = false,
  haptic,
  reason,
  accessibilityLabel,
  style,
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const textColor = disabled ? colors.textMuted : getTextColors(colors)[variant] || colors.textOnDark;
  const spinnerColor = variant === 'primary' || variant === 'danger' ? colors.textOnDark : colors.primaryText;
  const useHaptic = haptic === undefined ? HAPTIC_VARIANTS.includes(variant) : haptic;
  const showReason = disabled && reason;

  const button = (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={useHaptic}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[styles.button, small && styles.small, styles[variant], disabled && styles.disabled, !showReason && style]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={textColor} style={styles.icon} /> : null}
          <Text style={[styles.label, small && styles.labelSmall, { color: textColor }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );

  if (!showReason) return button;

  return (
    <View style={style}>
      {button}
      <View style={styles.reasonRow}>
        <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
        <Text style={styles.reason} maxFontSizeMultiplier={MAX_FONT_SCALE}>{reason}</Text>
      </View>
    </View>
  );
}
