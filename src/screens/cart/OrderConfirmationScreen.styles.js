import { StyleSheet } from 'react-native';
import { makeTypography, radius, spacing } from '../../theme/theme';

export const createStyles = (colors) => {
  const type = makeTypography(colors);
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    body: { width: '100%', maxWidth: 480, gap: spacing.lg },
    intro: { alignItems: 'center', gap: spacing.xs },
    check: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.successSoft,
      marginBottom: spacing.xs,
    },
    title: { ...type.h1, textAlign: 'center' },
    message: { ...type.caption, textAlign: 'center' },
    number: { ...type.bodyStrong, color: colors.primaryText, textAlign: 'center' },
    summary: { paddingHorizontal: spacing.md, paddingVertical: 0 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowContent: { flex: 1 },
    label: type.caption,
    value: type.bodyStrong,
    detail: type.caption,
    total: type.price,
    room: { alignSelf: 'flex-start', marginTop: spacing.xs },
    actions: { gap: spacing.sm },
  });
};
