import { StyleSheet } from 'react-native';

export const createStyles = (c) => StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', minWidth: 44 },
  indicator: { position: 'absolute', top: -10, width: 22, height: 3, borderRadius: 2 },
  badge: { position: 'absolute', top: -6, right: -2 },
});
