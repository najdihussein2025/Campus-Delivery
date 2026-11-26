import { StyleSheet } from 'react-native';
import { fonts, radius, spacing, makeTypography } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  title: { ...makeTypography(c).h3, marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { ...makeTypography(c).body, color: c.textMuted },
  labelStrong: { fontFamily: fonts.bold, color: c.text, fontSize: 17 },
  value: { fontFamily: fonts.bold, fontSize: 15.5, color: c.text, textAlign: 'right' },
  valueStrong: { fontFamily: fonts.extrabold, fontSize: 20 },
  valueFree: { color: c.successText },
  divider: { height: 1, backgroundColor: c.border, marginVertical: spacing.sm },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  hintDanger: { backgroundColor: c.dangerSoft },
  hintInfo: { backgroundColor: c.infoSoft },
  hintText: { fontFamily: fonts.medium, fontSize: 13, marginLeft: spacing.sm, flex: 1 },
  hintTextDanger: { color: c.dangerText },
  hintTextInfo: { color: c.infoText },
});
