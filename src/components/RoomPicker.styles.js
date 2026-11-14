import { StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme/theme';

export default StyleSheet.create({
  stepLabel: { ...typography.micro, marginTop: spacing.md, marginBottom: spacing.sm },
  buildingList: { paddingBottom: spacing.xs },
  building: {
    width: 138,
    minHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  buildingSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  codeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  codeCircleSelected: { backgroundColor: colors.primary },
  codeText: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.primary },
  codeTextSelected: { color: colors.textOnDark },
  buildingName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  landmarks: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 15, color: colors.textMuted, marginTop: 2 },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  error: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.dangerText, marginTop: 2 },
  roomRow: { flexDirection: 'row', alignItems: 'flex-start' },
  roomInput: { flex: 1, marginRight: spacing.md, marginBottom: 0 },
  preview: { flex: 1.1, paddingTop: 2 },
});
