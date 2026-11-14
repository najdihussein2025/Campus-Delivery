import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { height: 44, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  primary: { backgroundColor: c.primary },
  secondary: { backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: c.dangerSolid },
  dangerOutline: { backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.danger },
  accent: { backgroundColor: c.accent },
  disabled: { backgroundColor: c.surfaceMuted, borderColor: c.surfaceMuted },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontFamily: fonts.bold, fontSize: 16 },
  labelSmall: { fontSize: 14 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  reason: { fontFamily: fonts.regular, fontSize: 13, color: c.textMuted, marginLeft: 5, textAlign: 'center' },
});
