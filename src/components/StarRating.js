import React, { useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import useReduceMotion from './motion/useReduceMotion';
import { tap } from '../utils/haptics';

import { createStyles } from './StarRating.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const STARS = [1, 2, 3, 4, 5];

// One star that springs up when tapped
function Star({ filled, size, disabled, onPress, label }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    tap();
    if (!reduceMotion) {
      scale.setValue(1.35);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 14 }).start();
    }
    onPress();
  };

  return (
    <PressableScale onPress={handlePress} disabled={disabled} hitSlop={4} accessibilityLabel={label} style={styles.star}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={filled ? colors.accentWarm : colors.border} />
      </Animated.View>
    </PressableScale>
  );
}

export default function StarRating({ value = 0, onChange, size = 32, readOnly = false }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityLabel={`Rating ${value} of 5`}>
      {STARS.map((star) => (
        <Star
          key={star}
          filled={star <= value}
          size={size}
          disabled={readOnly}
          label={`${star} star${star > 1 ? 's' : ''}`}
          onPress={() => onChange && onChange(star)}
        />
      ))}
    </View>
  );
}
