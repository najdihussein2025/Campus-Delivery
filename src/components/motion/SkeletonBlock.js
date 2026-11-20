import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { easings } from '../../theme/motion';
import useReduceMotion from './useReduceMotion';
import { useTheme } from '../../context/ThemeContext';
import { createStyles } from './SkeletonBlock.styles';
import useThemedStyles from '../../hooks/useThemedStyles';

// Loading placeholder: a grey block with an animated light gradient sweeping across (translateX on the UI thread).
// Reduce Motion: a static block.
export default function SkeletonBlock({ width = '100%', height = 16, radius = 8, style }) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();
  const reduceMotion = useReduceMotion();
  const [box, setBox] = useState(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || !box) return undefined;
    sweep.value = 0;
    sweep.value = withRepeat(withTiming(1, { duration: 1200, easing: easings.standard }), -1, false);
    return () => cancelAnimation(sweep);
  }, [reduceMotion, box]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -box * 0.6 + sweep.value * box * 1.6 }],
  }));

  return (
    <View style={[styles.block, { width, height, borderRadius: radius }, style]} onLayout={(e) => setBox(e.nativeEvent.layout.width)}>
      {!reduceMotion && box > 0 ? (
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: box * 0.6 }, sweepStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
