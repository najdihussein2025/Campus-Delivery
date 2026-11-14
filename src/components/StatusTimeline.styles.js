import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  row: { flexDirection: 'row', minHeight: 64 },
  rail: { width: 44, alignItems: 'center' },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: c.primary },
  circleCurrent: { backgroundColor: c.accentSoft, borderWidth: 2.5, borderColor: c.accent },
  pulse: { position: 'absolute', top: -2, right: -2 },
  line: {
    flex: 1,
    width: 3,
    backgroundColor: c.border,
    marginVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lineFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.primary, transformOrigin: 'top' },
  textBox: { flex: 1, marginLeft: spacing.md, paddingTop: spacing.sm },
  step: { fontFamily: fonts.bold, fontSize: 15.5, color: c.text },
  stepMuted: { color: c.textMuted },
  time: { fontFamily: fonts.regular, fontSize: 12.5, color: c.textMuted, marginTop: 2 },
  timeCurrent: { color: c.primaryText, fontFamily: fonts.medium },
  cancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.dangerSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: { fontFamily: fonts.bold, fontSize: 14, color: c.dangerText, marginLeft: spacing.sm },
});
