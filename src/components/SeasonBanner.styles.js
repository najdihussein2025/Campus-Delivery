import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    marginTop: spacing.md,
    minHeight: 52,
  },
  bannerLent: { backgroundColor: c.warningSoft },
  bannerInfo: { backgroundColor: c.infoSoft },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.md, minHeight: 52 },
  text: { flex: 1, fontFamily: fonts.bold, fontSize: 13.5, lineHeight: 19, marginLeft: spacing.sm },
  textLent: { color: c.warningText },
  textInfo: { color: c.infoText },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
