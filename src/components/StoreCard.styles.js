import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing, makeTypography } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  inner: { flexDirection: 'row', alignItems: 'center' },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  photoPlaceholder: { backgroundColor: c.surfaceMuted },
  info: { flex: 1, marginRight: spacing.sm },
  name: { ...makeTypography(c).h3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: c.textMuted, marginLeft: 4, flexShrink: 1 },
  prepRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  prep: { flexDirection: 'row', alignItems: 'center' },
  category: { fontFamily: fonts.bold, fontSize: 12, color: c.primaryText, marginRight: spacing.xs },
  status: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    fontFamily: fonts.bold,
    fontSize: 12,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  open: { color: c.successText, backgroundColor: c.successSoft },
  closed: { color: c.dangerText, backgroundColor: c.dangerSoft },
  reward: { color: c.primaryText, fontFamily: fonts.bold },
});
