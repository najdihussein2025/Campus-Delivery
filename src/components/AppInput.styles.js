import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { fontFamily: fonts.bold, fontSize: 14, color: c.text, marginBottom: spacing.sm },
  field: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  fieldFocused: { borderColor: c.primary, borderWidth: 1.5 },
  fieldError: { borderColor: c.danger, borderWidth: 1.5 },
  icon: { marginRight: spacing.md },
  input: { flex: 1, height: '100%', fontFamily: fonts.regular, fontSize: 15.5, color: c.text },
  suffix: { fontFamily: fonts.medium, fontSize: 14.5, color: c.textMuted, marginLeft: spacing.xs },
  trailing: { minWidth: 32, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  error: { fontFamily: fonts.medium, fontSize: 12.5, color: c.dangerText, marginLeft: 5, flex: 1 },
});
