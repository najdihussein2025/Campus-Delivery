import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

const screw = {
  width: 5,
  height: 5,
  borderRadius: 3,
  backgroundColor: 'rgba(255,255,255,0.45)',
};

export default StyleSheet.create({
  wrapper: { alignItems: 'flex-start' },
  plate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  plate_sm: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  plate_md: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  plate_lg: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, borderRadius: radius.md },
  screwLeft: { ...screw, marginRight: spacing.sm },
  screwRight: { ...screw, marginLeft: spacing.sm },
  code: { fontFamily: fonts.extrabold, color: colors.textOnDark, letterSpacing: 1 },
  code_sm: { fontSize: 13 },
  code_md: { fontSize: 18 },
  code_lg: { fontSize: 28, letterSpacing: 1.5 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 6 },
  subtitleSmall: { fontSize: 12, marginTop: 3 },
});
