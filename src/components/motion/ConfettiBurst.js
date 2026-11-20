import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { easings } from '../../theme/motion';
import useReduceMotion from './useReduceMotion';

const DEFAULT_COLORS = ['#005BAA', '#00AEEF', '#FBB040', '#FFFFFF'];

function Piece({ piece, progress }) {
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: 1 - t * t,
      transform: [
        { translateX: piece.vx * t },
        { translateY: piece.vy * t + 260 * t * t },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { width: piece.size, height: piece.size * 0.6, backgroundColor: piece.color }, style]} />;
}

// Short confetti burst (12–16 small Reanimated pieces, ≤ 900 ms, UI thread). Renders nothing with Reduce Motion.
// `trigger` changes (a counter or true) → one burst from the centre of this box. pointerEvents none: never blocks taps.
export default function ConfettiBurst({ trigger, count = 14, colors = DEFAULT_COLORS, duration = 900, style, onDone }) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 90 + Math.random() * 110;
        return {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 120,
          spin: (Math.random() - 0.5) * 720,
          size: 7 + Math.random() * 5,
          color: colors[i % colors.length],
        };
      }),
    [count, trigger]
  );

  useEffect(() => {
    if (!trigger || reduceMotion) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: easings.standard }, (finished) => {
      if (finished && onDone) runOnJS(onDone)();
    });
  }, [trigger, reduceMotion]);

  if (!trigger || reduceMotion) return null;
  return (
    <View pointerEvents="none" style={[styles.box, style]}>
      {pieces.map((piece, i) => (
        <Piece key={i} piece={piece} progress={progress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  piece: { position: 'absolute', borderRadius: 2 },
});
