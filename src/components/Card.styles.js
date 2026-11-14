import { StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
});
