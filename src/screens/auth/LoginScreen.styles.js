import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../../theme/theme';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.xl },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logo: { marginBottom: spacing.xl },
  title: typography.h1,
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  form: { marginTop: spacing.xl },
  button: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: spacing.xl, minHeight: 44 },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary, paddingVertical: spacing.sm },
});
