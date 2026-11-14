import { StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme/theme';

export default StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  step: { alignItems: 'center', minWidth: 56, minHeight: 44, justifyContent: 'center' },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { borderColor: colors.primary },
  circleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  number: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.textMuted },
  numberActive: { color: colors.primary },
  label: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  labelActive: { color: colors.text },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    marginBottom: 18,
  },
  connectorDone: { backgroundColor: colors.primary },
});
