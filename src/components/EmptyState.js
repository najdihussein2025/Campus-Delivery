import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import FadeInView from './motion/FadeInView';
import useReduceMotion from './motion/useReduceMotion';
import { springs } from '../theme/motion';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './EmptyState.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Friendly empty screen: icon in a soft UA-blue circle, title, one line of help and an action
export default function EmptyState({ icon = 'sparkles-outline', title, subtitle, actionLabel, onAction, style }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  // Calm illustration (no Lottie): the icon circle pops in once and the icon gives one little tilt. No looping motion.
  const pop = useSharedValue(reduceMotion ? 1 : 0.7);
  const tilt = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    pop.value = withSpring(1, springs.bouncy);
    tilt.value = withDelay(350, withSequence(withTiming(-10, { duration: 140 }), withTiming(8, { duration: 140 }), withSpring(0, springs.bouncy)));
  }, []);
  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));
  return (
    <FadeInView style={[styles.container, style]}>
      <View style={styles.iconOuter}>
        <Animated.View style={[styles.iconCircle, circleStyle]}>
          <Animated.View style={iconStyle}>
            <Ionicons name={icon} size={36} color={colors.primaryText} />
          </Animated.View>
        </Animated.View>
      </View>
      <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{subtitle}</Text> : null}
      {actionLabel ? <AppButton title={actionLabel} onPress={onAction} style={styles.button} /> : null}
    </FadeInView>
  );
}
