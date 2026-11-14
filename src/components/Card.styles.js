import { StyleSheet } from 'react-native';
import { radius, shadow, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
});
