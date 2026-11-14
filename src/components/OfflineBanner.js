import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../context/NetworkContext';
import { MAX_FONT_SCALE } from '../theme/theme';
import useReduceMotion from './motion/useReduceMotion';
import { createStyles } from './OfflineBanner.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const SLIDE = 90;

// Rendered once at the root, under the safe area. Slides down when offline; when the connection comes back it
// turns green for 2 s ("Back online") and slides away.
export default function OfflineBanner() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { isOnline } = useNetwork();
  const [mode, setMode] = useState('hidden'); // hidden | offline | back
  const wasOffline = useRef(false);
  const slide = useRef(new Animated.Value(-SLIDE)).current;

  const slideTo = (toValue, done) => {
    Animated.timing(slide, {
      toValue,
      duration: reduceMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(done);
  };

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setMode('offline');
      slideTo(0);
      return undefined;
    }
    if (!wasOffline.current) return undefined;
    wasOffline.current = false;
    setMode('back');
    slideTo(0);
    const timer = setTimeout(() => slideTo(-SLIDE, () => setMode('hidden')), 2000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (mode === 'hidden') return null;
  const back = mode === 'back';

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, back ? styles.bannerBack : styles.bannerOffline, { top: insets.top, transform: [{ translateY: slide }] }]}
    >
      <Ionicons
        name={back ? 'checkmark-circle' : 'cloud-offline'}
        size={20}
        color={back ? colors.successText : colors.warningText}
      />
      <Text style={[styles.text, back ? styles.textBack : styles.textOffline]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {back ? 'Back online' : "You're offline · showing saved data"}
      </Text>
    </Animated.View>
  );
}
