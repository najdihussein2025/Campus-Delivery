import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme/theme';

export default StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { ...typography.body, color: colors.textMuted },
  labelStrong: { fontFamily: fonts.bold, color: colors.text, fontSize: 17 },
  value: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text, textAlign: 'right' },
  valueStrong: { fontFamily: fonts.extrabold, fontSize: 20 },
  valueFree: { color: '#007A38' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  hintDanger: { backgroundColor: colors.dangerSoft },
  hintInfo: { backgroundColor: colors.infoSoft },
  hintText: { fontFamily: fonts.medium, fontSize: 13, marginLeft: spacing.sm, flex: 1 },
  hintTextDanger: { color: colors.dangerText },
  hintTextInfo: { color: colors.infoText },
});
