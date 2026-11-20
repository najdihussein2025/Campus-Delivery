import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import ProductImage from '../ProductImage';
import { tap } from '../../utils/haptics';
import { easings, springs } from '../../theme/motion';
import useReduceMotion from './useReduceMotion';

const FlyContext = createContext({ fly: () => false, flyFrom: () => {}, registerTarget: () => () => {} });
export const useFlyToBag = () => useContext(FlyContext);

const SIZE = 40;
const DURATION = 550;

// One flying thumbnail: moves along a quadratic curve from `from` to `to` (UI thread, transform + opacity only)
function Flight({ flight, onLanded }) {
  const progress = useSharedValue(0);
  const { from, to } = flight;
  useEffect(() => {
    progress.value = withTiming(1, { duration: DURATION, easing: easings.standard }, (finished) => {
      if (finished) runOnJS(onLanded)(flight.id);
    });
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const cx = (from.x + to.x) / 2;
    const cy = Math.min(from.y, to.y) - 140; // control point above both ends: the arc
    const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * to.x;
    const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * to.y;
    return {
      opacity: interpolate(t, [0, 1], [1, 0.6]),
      transform: [{ translateX: x - SIZE / 2 }, { translateY: y - SIZE / 2 }, { scale: interpolate(t, [0, 1], [1, 0.4]) }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.flight, style]}>
      <ProductImage category={flight.category} productId={flight.productId} size={SIZE} rounded={10} iconSize={18} style={styles.thumb} />
    </Animated.View>
  );
}

// Signature interaction: a copy of the product thumbnail flies along a curve to the bag icon, then the icon bumps
// (FlyTarget) and the badge rolls (BumpBadge). Needs this provider at the root (overlay layer).
// Reduce Motion: no flight, the call returns false so the caller can show a toast instead.
export function FlyToBagProvider({ children }) {
  const reduceMotion = useReduceMotion();
  const [flights, setFlights] = useState([]);
  const targets = useRef([]); // the last registered, active target wins: header bag on Home / Menu, otherwise the tab icon
  const counter = useRef(0);

  const registerTarget = useCallback((target) => {
    targets.current.push(target);
    return () => {
      targets.current = targets.current.filter((t) => t !== target);
    };
  }, []);

  // from: { x, y } = centre in window coordinates. Returns true when a flight starts.
  const fly = useCallback(
    ({ from, category, productId }) => {
      const target = targets.current[targets.current.length - 1];
      if (!target || !from || reduceMotion) return false;
      const node = target.ref.current;
      if (!node || !node.measureInWindow) return false;
      node.measureInWindow((x, y, w, h) => {
        if (!w && !h) return;
        counter.current += 1;
        setFlights((prev) => [...prev, { id: counter.current, from, to: { x: x + w / 2, y: y + h / 2 }, category, productId, target }]);
      });
      return true;
    },
    [reduceMotion]
  );

  // Measure a view (card thumbnail, Add button …) and fly from its centre
  const flyFrom = useCallback(
    (ref, info) => {
      const node = ref && ref.current;
      if (!node || !node.measureInWindow) return;
      node.measureInWindow((x, y, w, h) => fly({ ...info, from: { x: x + w / 2, y: y + h / 2 } }));
    },
    [fly]
  );

  const landed = useCallback((id) => {
    setFlights((prev) => {
      const done = prev.find((f) => f.id === id);
      if (done && done.target.bump) done.target.bump();
      return prev.filter((f) => f.id !== id);
    });
    tap();
  }, []);

  return (
    <FlyContext.Provider value={{ fly, flyFrom, registerTarget }}>
      {children}
      <View pointerEvents="none" style={styles.layer}>
        {flights.map((flight) => (
          <Flight key={flight.id} flight={flight} onLanded={landed} />
        ))}
      </View>
    </FlyContext.Provider>
  );
}

// Wrap a bag icon with this: it registers as a landing spot and does a quick spring bump when something lands.
// `active` false (e.g. its screen is not focused) removes it from the landing spots.
export function FlyTarget({ children, style, active = true }) {
  const { registerTarget } = useFlyToBag();
  const reduceMotion = useReduceMotion();
  const ref = useRef(null);
  const scale = useSharedValue(1);
  const bump = useCallback(() => {
    if (reduceMotion) return;
    scale.value = withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, springs.bouncy));
  }, [reduceMotion]);
  useEffect(() => {
    if (!active) return undefined;
    return registerTarget({ ref, bump });
  }, [active, bump]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View ref={ref} collapsable={false} style={[style, animated]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 999, elevation: 999 },
  flight: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE },
  thumb: { width: SIZE },
});
