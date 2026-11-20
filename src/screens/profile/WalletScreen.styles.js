import { StyleSheet } from 'react-native';
import { fonts, radius, shadow, spacing, makeTypography } from '../../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  balanceCard: { borderRadius: radius.xl, padding: spacing.xl, minHeight: 190, overflow: 'hidden', ...shadow.card },
  // UA watermark: bottom-right corner at ~8 % opacity so it never overlaps the text
  watermark: { position: 'absolute', width: 130, height: 130 / 3.3, right: spacing.lg, bottom: spacing.md, opacity: 0.08 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, color: 'rgba(255,255,255,0.8)' },
  contactless: { transform: [{ rotate: '90deg' }] },
  balance: { fontFamily: fonts.extrabold, fontSize: 42, color: c.textOnDark, marginTop: spacing.xl },
  balanceHint: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  presets: { marginBottom: spacing.md, flexGrow: 0 },
  presetChip: { flex: 1, justifyContent: 'center' },
  note: { ...makeTypography(c).caption, textAlign: 'center', marginTop: spacing.md },
  dayLabel: { ...makeTypography(c).micro, marginTop: spacing.md, marginBottom: spacing.sm },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  txIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txText: { flex: 1 },
  txLabel: { ...makeTypography(c).bodyStrong },
  txDate: { ...makeTypography(c).caption, marginTop: 1 },
  txAmount: { fontFamily: fonts.extrabold, fontSize: 16, textAlign: 'right', marginLeft: spacing.sm },
  successCheck: { alignItems: 'center', marginTop: spacing.lg },
});
