import { StyleSheet } from 'react-native';
import { fonts, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  step: { alignItems: 'center', minWidth: 56, minHeight: 44, justifyContent: 'center' },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { borderColor: c.primary },
  circleDone: { backgroundColor: c.primary, borderColor: c.primary },
  number: { fontFamily: fonts.bold, fontSize: 13.5, color: c.textMuted },
  numberActive: { color: c.primaryText },
  label: { fontFamily: fonts.bold, fontSize: 12.5, color: c.textMuted, marginTop: 4 },
  labelActive: { color: c.text },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: c.border,
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
    marginBottom: 18,
  },
  connectorFill: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.primary },
});
