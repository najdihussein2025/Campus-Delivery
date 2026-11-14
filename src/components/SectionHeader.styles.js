import { StyleSheet } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme/theme';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  title: typography.micro,
  actionBox: { minHeight: 32, justifyContent: 'center' },
  action: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.primary },
});
