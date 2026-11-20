import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  chipOuter: { marginRight: spacing.sm, marginBottom: spacing.sm },
  // backgroundColor / borderColor are animated (cross-fade) in Chip.js
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipTall: { borderRadius: radius.md, paddingVertical: spacing.sm },
  disabled: { opacity: 0.45 },
  icon: { marginRight: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: c.text },
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
