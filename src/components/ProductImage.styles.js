import { StyleSheet } from 'react-native';

export const createStyles = (c) => StyleSheet.create({
  box: { width: '100%', overflow: 'hidden' },
  dimmed: { opacity: 0.45 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: {
    position: 'absolute',
    width: '90%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: '-35%',
    right: '-35%',
  },
});
