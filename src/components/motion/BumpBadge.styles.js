import { StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../../theme/theme';

export default StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.accentWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  text: { fontFamily: fonts.extrabold, fontSize: 11, color: colors.primaryDark },
});
