import { StyleSheet } from 'react-native';
import { fonts, spacing, makeTypography } from '../../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  statusCard: { flexDirection: 'row', alignItems: 'center' },
  statusOn: { backgroundColor: c.successSoft },
  statusOff: { backgroundColor: c.warningSoft },
  statusText: { flex: 1, marginLeft: spacing.md },
  statusTitle: { fontFamily: fonts.bold, fontSize: 15.5 },
  statusTitleOn: { color: c.successText },
  statusTitleOff: { color: c.warningText },
  statusSub: { ...makeTypography(c).caption, color: c.text, marginTop: 2 },
  statusButton: { marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  rowDivider: { borderTopWidth: 1, borderTopColor: c.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  rowText: { flex: 1, marginRight: spacing.md },
  rowTitle: makeTypography(c).bodyStrong,
  rowSub: makeTypography(c).caption,
  leadBlock: { marginTop: spacing.sm },
  leadLabel: { ...makeTypography(c).micro, marginBottom: spacing.sm },
  leadRow: { flexDirection: 'row' },
  testButton: { marginTop: spacing.md },
});
