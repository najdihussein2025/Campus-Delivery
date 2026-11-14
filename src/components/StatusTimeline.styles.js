import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';

export default StyleSheet.create({
  row: { flexDirection: 'row', minHeight: 64 },
  rail: { width: 44, alignItems: 'center' },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.primary },
  circleCurrent: { backgroundColor: colors.accentSoft, borderWidth: 2.5, borderColor: colors.accent },
  pulse: { position: 'absolute', top: -2, right: -2 },
  line: {
    flex: 1,
    width: 3,
    backgroundColor: colors.border,
    marginVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lineFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.primary, transformOrigin: 'top' },
  textBox: { flex: 1, marginLeft: spacing.md, paddingTop: spacing.sm },
  step: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.text },
  stepMuted: { color: colors.textMuted },
  time: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  timeCurrent: { color: colors.primary, fontFamily: fonts.medium },
  cancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: { fontFamily: fonts.bold, fontSize: 14, color: colors.dangerText, marginLeft: spacing.sm },
});
