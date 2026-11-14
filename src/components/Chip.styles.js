import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipTall: { borderRadius: radius.md, paddingVertical: spacing.sm },
  selected: { backgroundColor: c.primary, borderColor: c.primary },
  disabled: { opacity: 0.45 },
  icon: { marginRight: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: c.text },
  labelSelected: { color: c.textOnDark },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: c.textMuted, marginTop: 1 },
  subtitleSelected: { color: 'rgba(255,255,255,0.85)' },
  count: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    marginLeft: spacing.sm,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { fontFamily: fonts.bold, fontSize: 12, color: c.primaryText },
  countTextSelected: { color: c.textOnDark },
});
