import { StyleSheet } from 'react-native';
import { radius, spacing, makeTypography } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.border,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...makeTypography(c).h2, textAlign: 'center' },
  message: { ...makeTypography(c).body, color: c.textMuted, textAlign: 'center', marginTop: spacing.sm },
  actions: { flexDirection: 'row', marginTop: spacing.xl, alignSelf: 'stretch' },
  action: { flex: 1, marginHorizontal: spacing.xs, paddingHorizontal: spacing.sm },
});
