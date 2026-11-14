import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

export default StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipTall: { borderRadius: radius.md, paddingVertical: spacing.sm },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.45 },
  icon: { marginRight: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  labelSelected: { color: colors.textOnDark },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  subtitleSelected: { color: 'rgba(255,255,255,0.85)' },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  countTextSelected: { color: colors.textOnDark },
});
