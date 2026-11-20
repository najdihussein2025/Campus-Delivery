import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing, makeTypography } from '../theme/theme';

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
  inner: { flexDirection: 'row', alignItems: 'center' },
  dimmed: { opacity: 0.55 },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  info: { flex: 1, marginRight: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { ...makeTypography(c).h3, flexShrink: 1 },
  categoryPill: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    flexShrink: 0,
  },
  categoryText: { fontFamily: fonts.bold, fontSize: 11, color: c.primaryText },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: c.textMuted, marginLeft: 4, flexShrink: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: c.textMuted, marginHorizontal: 6 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  browse: { fontFamily: fonts.bold, fontSize: 13, color: c.primaryText },
});
