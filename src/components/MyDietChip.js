import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import { tagLabel } from '../utils/diet';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './MyDietChip.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// "My diet: Vegetarian ×": the saved diet applied on open. The × clears it for this visit only.
export default function MyDietChip({ tags, onRemove }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const names = tags.map(tagLabel).join(', ');
  return (
    <PressableScale onPress={onRemove} style={styles.chip} accessibilityLabel={`My diet: ${names}. Remove for this visit`}>
      <Text style={styles.text} maxFontSizeMultiplier={MAX_FONT_SCALE}>My diet: {names}</Text>
      <Ionicons name="close" size={16} color={colors.primaryText} />
    </PressableScale>
  );
}
