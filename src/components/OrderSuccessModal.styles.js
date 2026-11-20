import { StyleSheet } from 'react-native';
import { fonts, spacing, makeTypography } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: c.background, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { ...makeTypography(c).display, textAlign: 'center', marginTop: spacing.xl },
  number: { fontFamily: fonts.bold, fontSize: 15, color: c.textBrand, textAlign: 'center', marginTop: spacing.xs },
  message: { ...makeTypography(c).body, color: c.textMuted, textAlign: 'center', marginTop: spacing.lg },
  strong: { fontFamily: fonts.bodyBold, color: c.text },
  sign: { alignSelf: 'center', alignItems: 'center', marginTop: spacing.lg },
});
