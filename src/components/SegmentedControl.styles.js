import { StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme/theme';

export default StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    ...shadow.card,
  },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  labelSelected: { color: colors.primary },
  subtitle: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted, marginTop: 1 },
  subtitleSelected: { color: colors.textBrand },
});
