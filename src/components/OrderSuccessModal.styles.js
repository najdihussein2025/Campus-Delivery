import { StyleSheet } from 'react-native';
import { colors, fonts, spacing, typography } from '../theme/theme';

export default StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.display, textAlign: 'center', marginTop: spacing.xl },
  number: { fontFamily: fonts.bold, fontSize: 15, color: colors.textBrand, textAlign: 'center', marginTop: spacing.xs },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  strong: { fontFamily: fonts.bodyBold, color: colors.text },
  sign: { alignSelf: 'center', alignItems: 'center', marginTop: spacing.lg },
});
