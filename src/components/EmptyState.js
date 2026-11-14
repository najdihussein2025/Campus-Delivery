import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import FadeInView from './motion/FadeInView';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './EmptyState.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Friendly empty screen: icon in a soft UA-blue circle, title, one line of help and an action
export default function EmptyState({ icon = 'sparkles-outline', title, subtitle, actionLabel, onAction, style }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <FadeInView style={[styles.container, style]}>
      <View style={styles.iconOuter}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={36} color={colors.primaryText} />
        </View>
      </View>
      <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{subtitle}</Text> : null}
      {actionLabel ? <AppButton title={actionLabel} onPress={onAction} style={styles.button} /> : null}
    </FadeInView>
  );
}
