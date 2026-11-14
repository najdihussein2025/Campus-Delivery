import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  card: {
    width: 158,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginRight: spacing.md,
    marginBottom: spacing.xs,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: c.surfaceMuted, opacity: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosPill: {
    backgroundColor: c.primaryDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  oosText: { fontFamily: fonts.bold, fontSize: 12, color: c.textOnDark },
  body: { paddingHorizontal: spacing.xs, paddingTop: spacing.sm, flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14.5, lineHeight: 19, color: c.text, minHeight: 38 },
  muted: { color: c.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    minHeight: 30,
  },
  price: { fontFamily: fonts.extrabold, fontSize: 15.5, color: c.text },
  plus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
