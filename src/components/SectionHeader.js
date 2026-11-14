import React from 'react';
import { Text, View } from 'react-native';
import PressableScale from './motion/PressableScale';
import { MAX_FONT_SCALE } from '../theme/theme';
import styles from './SectionHeader.styles';

export default function SectionHeader({ title, actionLabel, onAction, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE} accessibilityRole="header">{title}</Text>
      {actionLabel ? (
        <PressableScale onPress={onAction} hitSlop={10} accessibilityLabel={actionLabel} style={styles.actionBox}>
          <Text style={styles.action} maxFontSizeMultiplier={MAX_FONT_SCALE}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
