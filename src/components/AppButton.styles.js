import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

export default StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { height: 44, paddingHorizontal: spacing.lg, borderRadius: radius.sm },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  dangerOutline: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.danger },
  accent: { backgroundColor: colors.accent },
  disabled: { backgroundColor: colors.surfaceMuted, borderColor: colors.surfaceMuted },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontFamily: fonts.bold, fontSize: 16 },
  labelSmall: { fontSize: 14 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  reason: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginLeft: 5, textAlign: 'center' },
});
