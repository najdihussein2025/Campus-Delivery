import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing, makeTypography } from '../theme/theme';

const SIZE = 48;

export const createStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  slot: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: c.border,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: { borderStyle: 'solid', borderColor: c.primary, backgroundColor: c.primary },
  // Absolutely centred so the number never drifts (iOS measured it off-centre next to the animated stamp layers)
  number: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: SIZE - 4,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    color: c.textMuted,
  },
  stamp: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', top: -2, left: -2, width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 3 },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  rewardBadge: { alignSelf: 'center', backgroundColor: c.accentWarm, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginBottom: spacing.md },
  rewardBadgeText: { fontFamily: fonts.extrabold, fontSize: 13, color: c.primaryDark },
  text: { ...makeTypography(c).bodyStrong, textAlign: 'center', marginTop: spacing.xs },
});
