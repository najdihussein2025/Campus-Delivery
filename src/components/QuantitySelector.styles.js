import { StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
  },
  rowSmall: { padding: 3 },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlus: { backgroundColor: colors.primary },
  btnSmall: { width: 32, height: 32, borderRadius: 16 },
  qty: { minWidth: 38, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  qtySmall: { minWidth: 30, fontSize: 15 },
});
