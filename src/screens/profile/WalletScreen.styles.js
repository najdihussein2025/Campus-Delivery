import { StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow, spacing, typography } from '../../theme/theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  balanceCard: { borderRadius: radius.xl, padding: spacing.xl, minHeight: 190, overflow: 'hidden', ...shadow.card },
  watermark: { position: 'absolute', width: 260, height: 260 / 3.3, right: -40, bottom: 6, opacity: 0.12 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, color: 'rgba(255,255,255,0.8)' },
  contactless: { transform: [{ rotate: '90deg' }] },
  balance: { fontFamily: fonts.extrabold, fontSize: 42, color: colors.textOnDark, marginTop: spacing.xl },
  balanceHint: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  presets: { flexDirection: 'row', marginBottom: spacing.md },
  presetChip: { flex: 1, justifyContent: 'center' },
  note: { ...typography.caption, textAlign: 'center', marginTop: spacing.md },
  dayLabel: { ...typography.micro, marginTop: spacing.md, marginBottom: spacing.sm },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  txIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  txText: { flex: 1 },
  txLabel: { ...typography.bodyStrong },
  txDate: { ...typography.caption, marginTop: 1 },
  txAmount: { fontFamily: fonts.extrabold, fontSize: 16, textAlign: 'right', marginLeft: spacing.sm },
  successCheck: { alignItems: 'center', marginTop: spacing.lg },
});
