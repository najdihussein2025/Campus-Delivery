import { StyleSheet } from 'react-native';
import { fonts, radius } from '../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  btnDisabled: { opacity: 0.4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: c.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
  },
  rowSmall: { padding: 3 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlus: { backgroundColor: c.primary },
  btnSmall: { width: 32, height: 32, borderRadius: 16 },
  qty: { minWidth: 38, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 17, color: c.text },
  qtySmall: { minWidth: 30, fontSize: 15 },
});
