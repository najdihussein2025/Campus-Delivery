import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import useReduceMotion from './useReduceMotion';
import { durations, easings, springs } from '../../theme/motion';
import { createStyles } from './AnimatedProgressBar.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const THUMB = 28;

// Progress bar whose fill animates to `progress` (0..1) on the UI thread (fill = scaleX, icon = translateX).
// `spring`: the icon travels with a spring (tracking); `wobble`: the icon rocks gently (the courier is on the way).
export default function AnimatedProgressBar({
  progress = 0,
  color,
  trackColor,
  height = 8,
  thumbIcon,
  spring = false,
  wobble = false,
  style,
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const fillColor = color || colors.primary;
  const trackBg = trackColor || colors.surfaceMuted;
  const reduceMotion = useReduceMotion();
  const clamped = Math.max(0, Math.min(1, progress));
  const value = useSharedValue(clamped);
  const rock = useSharedValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (reduceMotion) value.value = clamped;
    else if (spring) value.value = withSpring(clamped, springs.gentle);
    else value.value = withTiming(clamped, { duration: durations.long, easing: easings.emphasizedDecel });
  }, [clamped, reduceMotion, spring]);

  useEffect(() => {
    if (wobble && !reduceMotion) {
      rock.value = withRepeat(withSequence(withTiming(-7, { duration: 420 }), withTiming(7, { duration: 420 })), -1, true);
    } else {
      cancelAnimation(rock);
      rock.value = withTiming(0, { duration: durations.short });
    }
    return () => cancelAnimation(rock);
  }, [wobble, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: value.value }], transformOrigin: 'left center' }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: value.value * Math.max(0, trackWidth - THUMB) }, { rotate: `${rock.value}deg` }],
  }));

  return (
    <View style={[styles.wrapper, thumbIcon && styles.wrapperThumb, style]}>
      <View
        style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackBg }]}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: fillColor }, fillStyle]} />
      </View>
      {thumbIcon && trackWidth > 0 ? (
        <Animated.View style={[styles.thumb, { left: 0, borderColor: fillColor }, thumbStyle]}>
          <Ionicons name={thumbIcon} size={15} color={fillColor} />
        </Animated.View>
      ) : null}
    </View>
  );
}
