import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
    elevation: 12,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadow.card,
  },
  bannerOffline: { backgroundColor: c.warningSoft, borderWidth: 1, borderColor: c.warning },
  bannerBack: { backgroundColor: c.successSoft, borderWidth: 1, borderColor: c.success },
  text: { fontFamily: fonts.bold, fontSize: 13.5, marginLeft: spacing.sm, flex: 1 },
  textOffline: { color: c.warningText },
  textBack: { color: c.successText },
});
