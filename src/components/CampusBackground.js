import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useReduceMotion from './motion/useReduceMotion';
import { campusBackground } from '../data/backgrounds';
import { gradients } from '../theme/theme';

// UA brand blue to near black. 85-95% opacity keeps white text above 4.5:1 even over the white building.
const OVERLAY = ['rgba(0,91,170,0.85)', 'rgba(12,38,64,0.9)', 'rgba(4,10,20,0.95)'];

// Full-screen photo of the UA Hadat–Baabda campus with a dark blue overlay and a slow zoom (Ken Burns, 1.0 → 1.06
// in 12 s). Reduce Motion turns the zoom off. Without the photo it falls back to the blue gradient.
// Used by Onboarding and Welcome; the same in light and dark mode (the overlay is always dark).
export default function CampusBackground({ children, style }) {
  const reduceMotion = useReduceMotion();
  const zoom = useRef(new Animated.Value(1)).current;
  const image = campusBackground;

  useEffect(() => {
    if (!image || reduceMotion) {
      zoom.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(zoom, { toValue: 1.06, duration: 12000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(zoom, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [image, reduceMotion]);

  if (!image) {
    return (
      <LinearGradient colors={gradients.hero} style={style}>
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.root, style]}>
      <Animated.Image
        source={image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={[StyleSheet.absoluteFill, styles.image, { transform: [{ scale: zoom }] }]}
      />
      <LinearGradient colors={OVERLAY} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C2640', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
