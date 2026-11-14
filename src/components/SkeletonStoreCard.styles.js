import { StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  lines: { flex: 1, marginLeft: spacing.lg },
  gap: { marginTop: spacing.sm },
  badge: { marginTop: spacing.lg },
});
