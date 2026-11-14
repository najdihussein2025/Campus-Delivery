import { StyleSheet } from 'react-native';
import { fonts, radius } from '../../theme/theme';

export const createStyles = (c) => StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: c.accentWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: c.surface,
  },
  text: { fontFamily: fonts.extrabold, fontSize: 11, color: c.primaryDark },
});
