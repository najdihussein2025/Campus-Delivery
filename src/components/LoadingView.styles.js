import { StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

export default StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  message: { marginTop: 12, color: colors.textMuted, fontSize: 14 },
});
