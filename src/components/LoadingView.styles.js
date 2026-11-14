import { StyleSheet } from 'react-native';


export const createStyles = (c) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
  message: { marginTop: 12, color: c.textMuted, fontSize: 14 },
});
