import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { createStyles } from './LoadingView.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Uses the system font on purpose: it can show before custom fonts are loaded
export default function LoadingView({ message }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryText} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
