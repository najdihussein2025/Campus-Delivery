import { StyleSheet } from 'react-native';
import { spacing, makeTypography } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  iconOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: c.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...makeTypography(c).h2, textAlign: 'center' },
  subtitle: { ...makeTypography(c).body, color: c.textMuted, textAlign: 'center', marginTop: spacing.sm },
  button: { marginTop: spacing.xl, minWidth: 200 },
});
