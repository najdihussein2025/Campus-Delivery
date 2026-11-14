import { StyleSheet } from 'react-native';
import { fonts, radius, spacing, makeTypography } from '../../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.xl },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logo: { marginBottom: spacing.xl },
  title: makeTypography(c).h1,
  subtitle: { ...makeTypography(c).body, color: c.textMuted, marginTop: spacing.xs },
  form: { marginTop: spacing.xl },
  button: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: spacing.xl, minHeight: 44 },
  footerText: { ...makeTypography(c).body, color: c.textMuted },
  link: { fontFamily: fonts.bold, fontSize: 15, color: c.primaryText, paddingVertical: spacing.sm },
});
