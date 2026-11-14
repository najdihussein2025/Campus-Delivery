import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

export default StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: spacing.sm },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  fieldFocused: { borderColor: colors.primary, borderWidth: 1.5 },
  fieldError: { borderColor: colors.danger, borderWidth: 1.5 },
  icon: { marginRight: spacing.md },
  input: { flex: 1, height: '100%', fontFamily: fonts.regular, fontSize: 15.5, color: colors.text },
  suffix: { fontFamily: fonts.medium, fontSize: 14.5, color: colors.textMuted, marginLeft: spacing.xs },
  trailing: { minWidth: 32, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  error: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.dangerText, marginLeft: 5, flex: 1 },
});
