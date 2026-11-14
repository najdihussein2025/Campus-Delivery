import React from 'react';
import { View } from 'react-native';
import PressableScale from './motion/PressableScale';
import { createStyles } from './Card.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// White surface card; becomes pressable (with scale feedback) when onPress is given
export default function Card({ children, style, onPress, accessibilityLabel }) {
  const styles = useThemedStyles(createStyles);
  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>
        {children}
      </PressableScale>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}
