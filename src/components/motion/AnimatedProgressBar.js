import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';
import useReduceMotion from './useReduceMotion';
import styles from './AnimatedProgressBar.styles';

const THUMB = 28;

// Progress bar whose fill animates to `progress` (0..1); optional icon rides on the fill edge
export default function AnimatedProgressBar({
  progress = 0,
  color = colors.primary,
  trackColor = colors.surfaceMuted,
  height = 8,
  thumbIcon,
  style,
}) {
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(progress)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (reduceMotion) {
      value.setValue(clamped);
      return;
    }
    // width can't use the native driver, so this one runs on the JS thread
    Animated.timing(value, {
      toValue: clamped,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, reduceMotion]);

  const fillWidth = value.interpolate({ inputRange: [0, 1], outputRange: [0, trackWidth] });
  const thumbLeft = value.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, trackWidth - THUMB)] });

  return (
    <View style={[styles.wrapper, thumbIcon && styles.wrapperThumb, style]}>
      <View
        style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.fill, { width: fillWidth, borderRadius: height / 2, backgroundColor: color }]} />
      </View>
      {thumbIcon && trackWidth > 0 ? (
        <Animated.View style={[styles.thumb, { left: thumbLeft, borderColor: color }]}>
          <Ionicons name={thumbIcon} size={15} color={color} />
        </Animated.View>
      ) : null}
    </View>
  );
}
