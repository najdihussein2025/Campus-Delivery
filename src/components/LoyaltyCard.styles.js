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
  number: { fontFamily: fonts.bold, fontSize: 15, color: c.textMuted },
  stamp: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  text: { ...makeTypography(c).bodyStrong, textAlign: 'center', marginTop: spacing.xs },
});
