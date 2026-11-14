import { StyleSheet } from 'react-native';
import { radius, shadow, spacing, makeTypography } from '../../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  how: { marginTop: spacing.lg },
  howRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  howIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  howText: { ...makeTypography(c).body, flex: 1 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  entryText: { flex: 1, marginLeft: spacing.md },
  entryTitle: makeTypography(c).bodyStrong,
  entryDate: { ...makeTypography(c).caption, marginTop: 1 },
});
