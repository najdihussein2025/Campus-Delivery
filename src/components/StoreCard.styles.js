import { StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow, spacing, typography } from '../theme/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
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
  name: typography.h3,
  category: { ...typography.caption, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textMuted, marginLeft: 4, flexShrink: 1 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted, marginHorizontal: 6 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  browse: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
});
