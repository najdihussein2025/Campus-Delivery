import { StyleSheet } from 'react-native';
import { fonts, MAX_FONT_SCALE, radius, shadow, spacing } from '../theme/theme';

const NAME_LINE_HEIGHT = 19;
const NAME_HEIGHT = Math.ceil(NAME_LINE_HEIGHT * 2 * MAX_FONT_SCALE);
const FOOTER_HEIGHT = 30;
const OPTION_HEIGHT = 34;
export const PRODUCT_IMAGE_HEIGHT = 110;
const CARD_HEIGHT = PRODUCT_IMAGE_HEIGHT + NAME_HEIGHT + FOOTER_HEIGHT + spacing.sm * 4 + 2;

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
  alignedCard: { height: CARD_HEIGHT },
  cardWithOption: { height: CARD_HEIGHT + OPTION_HEIGHT },
  alignedImage: { height: PRODUCT_IMAGE_HEIGHT, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: c.surfaceMuted, opacity: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs,
    borderRadius: 12,
    backgroundColor: c.accentWarmSoft,
  },
  photoBadge: { position: 'absolute', bottom: spacing.sm, alignSelf: 'center' },
  oosPill: {
    backgroundColor: c.primaryDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  oosText: { fontFamily: fonts.bold, fontSize: 12, color: c.textOnDark },
  body: { paddingHorizontal: spacing.xs, paddingTop: spacing.sm, flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14.5, lineHeight: NAME_LINE_HEIGHT, color: c.text, minHeight: NAME_LINE_HEIGHT * 2 },
  alignedName: { height: NAME_HEIGHT, includeFontPadding: false },
  muted: { color: c.textMuted },
  option: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted },
  optionSlot: { height: OPTION_HEIGHT },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    minHeight: FOOTER_HEIGHT,
  },
  alignedFooter: { height: FOOTER_HEIGHT },
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
