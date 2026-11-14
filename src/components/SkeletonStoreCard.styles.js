import { StyleSheet } from 'react-native';
import { radius, shadow, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  lines: { flex: 1, marginLeft: spacing.lg },
  gap: { marginTop: spacing.sm },
  badge: { marginTop: spacing.lg },
});
