import { StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: c.primarySoft,
    marginTop: spacing.md,
  },
  text: { fontFamily: fonts.bold, fontSize: 13.5, color: c.primaryText, marginRight: spacing.sm, flexShrink: 1 },
});
