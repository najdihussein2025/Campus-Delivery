import { StyleSheet } from 'react-native';


export const createStyles = (c) => StyleSheet.create({
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
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
