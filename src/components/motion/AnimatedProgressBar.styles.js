import { StyleSheet } from 'react-native';
import { colors } from '../../theme/theme';

export default StyleSheet.create({
  wrapper: { justifyContent: 'center' },
  wrapperThumb: { height: 28 },
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
