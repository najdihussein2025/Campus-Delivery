import { StyleSheet } from 'react-native';
import { radius, spacing, makeTypography } from '../theme/theme';

export const createStyles = (colors) => {
  const type = makeTypography(colors);
  return StyleSheet.create({
    card: { padding: spacing.md, gap: spacing.xs, shadowOpacity: 0, elevation: 0 },
    compactCard: { paddingVertical: spacing.sm },
    compactReward: { paddingVertical: spacing.xs, marginTop: 0 },
    headingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
    heading: { ...type.h3, color: colors.primaryText },
    caption: type.caption,
    row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.xs },
    slot: {
      width: '9%',
      maxWidth: 30,
      aspectRatio: 1,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filled: { borderColor: colors.primary, backgroundColor: colors.primary },
    progress: { ...type.bodyStrong, color: colors.primaryText },
    reward: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.accentWarmSoft,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.xs,
    },
    rewardText: { flex: 1 },
  });
};
