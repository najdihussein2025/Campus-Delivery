import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import PressableScale from './motion/PressableScale';
import useReduceMotion from './motion/useReduceMotion';
import { tap } from '../utils/haptics';
import { MAX_FONT_SCALE } from '../theme/theme';
import styles from './SegmentedControl.styles';

// Segmented control: a white indicator slides (Animated.spring) under the selected option
export default function SegmentedControl({ options = [], value, onChange, style }) {
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const position = useRef(new Animated.Value(index)).current;
  const segmentWidth = options.length ? (width - 8) / options.length : 0;

  useEffect(() => {
    if (reduceMotion) {
      position.setValue(index);
      return;
    }
    Animated.spring(position, { toValue: index, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [index, reduceMotion]);

  const translateX = position.interpolate({
    inputRange: [0, Math.max(1, options.length - 1)],
    outputRange: [0, segmentWidth * Math.max(1, options.length - 1)],
  });

  return (
    <View style={[styles.track, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
      {width > 0 ? (
        <Animated.View style={[styles.indicator, { width: segmentWidth, transform: [{ translateX }] }]} />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={String(option.value)}
            onPress={() => {
              if (!selected) tap();
              onChange(option.value);
            }}
            scaleTo={0.97}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={styles.segment}
          >
            <Text style={[styles.label, selected && styles.labelSelected]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {option.label}
            </Text>
            {option.subtitle ? (
              <Text style={[styles.subtitle, selected && styles.subtitleSelected]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {option.subtitle}
              </Text>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}
