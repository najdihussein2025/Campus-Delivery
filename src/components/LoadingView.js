import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../theme/theme';
import styles from './LoadingView.styles';

// Uses the system font on purpose: it can show before custom fonts are loaded
export default function LoadingView({ message }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}
