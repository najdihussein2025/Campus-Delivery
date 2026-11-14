import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './Chip.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Selectable pill (filters, options); optional subtitle line and count bubble
export default function Chip({ label, selected = false, onPress, icon, disabled = false, subtitle, count, style }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={[styles.chip, subtitle && styles.chipTall, selected && styles.selected, disabled && styles.disabled, style]}
    >
      {icon ? <Ionicons name={icon} size={15} color={selected ? colors.textOnDark : colors.primary} style={styles.icon} /> : null}
      <View>
        <Text style={[styles.label, selected && styles.labelSelected]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {label}
        </Text>
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
    </PressableScale>
  );
}
