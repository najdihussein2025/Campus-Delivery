import { StyleSheet } from 'react-native';
import { fonts, radius, shadow } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: c.surfaceMuted,
    borderRadius: radius.md,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    ...shadow.card,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  segmentDisabled: { opacity: 0.5 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  compactSegment: { paddingVertical: 3 },
  label: { fontFamily: fonts.bold, fontSize: 14, color: c.textMuted },
  compactLabel: { fontSize: 13 },
  labelSelected: { color: c.primaryText },
  subtitle: { fontFamily: fonts.regular, fontSize: 11.5, color: c.textMuted, marginTop: 1 },
  subtitleSelected: { color: c.textBrand },
});
