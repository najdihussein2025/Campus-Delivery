import { StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow, spacing } from '../theme/theme';

export default StyleSheet.create({
  card: {
    width: 158,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginRight: spacing.md,
    marginBottom: spacing.xs,
    ...shadow.card,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: 'rgba(237, 239, 243, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosPill: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  oosText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textOnDark },
  body: { paddingHorizontal: spacing.xs, paddingTop: spacing.sm, flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14.5, lineHeight: 19, color: colors.text, minHeight: 38 },
  muted: { color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    minHeight: 30,
  },
  price: { fontFamily: fonts.extrabold, fontSize: 15.5, color: colors.text },
  plus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
