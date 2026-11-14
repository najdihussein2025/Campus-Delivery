import { StyleSheet } from 'react-native';
import { fonts, spacing, makeTypography } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: makeTypography(c).micro,
  actionBox: { minHeight: 32, justifyContent: 'center' },
  action: { fontFamily: fonts.bold, fontSize: 13.5, color: c.primaryText },
});
