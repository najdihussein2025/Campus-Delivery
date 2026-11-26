import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing } from '../../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  root: { flex: 1 },
  container: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 999, elevation: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: c.primaryDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  bagLane: { height: 68, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  bagToast: { flex: 1, paddingVertical: 0 },
  bagText: { flex: 1, minWidth: 0, marginLeft: spacing.sm },
  bagMessage: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18, color: c.textOnDark },
  bagFilename: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.textOnDark },
  bagAction: { minHeight: 44 },
  message: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: c.textOnDark, marginLeft: spacing.md },
  action: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginLeft: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionText: { fontFamily: fonts.extrabold, fontSize: 14, color: c.accent },
});
