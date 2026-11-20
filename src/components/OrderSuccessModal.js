import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import DoorSign from './DoorSign';
import FadeInView from './motion/FadeInView';
import SuccessCheck from './motion/SuccessCheck';
import ConfettiBurst from './motion/ConfettiBurst';
import useReduceMotion from './motion/useReduceMotion';
import { success } from '../utils/haptics';
import { MAX_FONT_SCALE } from '../theme/theme';
import { durations, easings, REDUCED_FADE_MS } from '../theme/motion';
import { createStyles } from './OrderSuccessModal.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// The door sign flips in (rotateX 90° → 0). Reduce Motion: a short fade.
function FlipIn({ children, delay = 0 }) {
  const reduceMotion = useReduceMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(reduceMotion ? 0 : delay, withTiming(1, { duration: reduceMotion ? REDUCED_FADE_MS : durations.long, easing: easings.emphasizedDecel }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 3),
    transform: reduceMotion ? [] : [{ perspective: 700 }, { rotateX: `${(1 - p.value) * 90}deg` }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// Full-screen "Order placed" moment (≤ 1.5 s): check mark draws inside a growing ring with ripples, a light confetti
// burst in UA colours, the room door sign flips in, success haptic. Tap anywhere to skip to the order.
export default function OrderSuccessModal({ visible, orderNumber, slotLabel, roomCode, onTrack }) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    success();
    const id = setTimeout(() => setBurst((n) => n + 1), 250);
    return () => clearTimeout(id);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onTrack}>
      <Pressable style={styles.flex} onPress={onTrack} accessibilityLabel="Continue to your order" accessibilityRole="button">
        <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
          {visible ? (
            <View style={styles.center}>
              <SuccessCheck size={96} />
              <ConfettiBurst trigger={burst} count={16} />
              <FadeInView delay={350}>
                <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE} accessibilityRole="header">
                  Order placed!
                </Text>
                {orderNumber ? (
                  <Text style={styles.number} maxFontSizeMultiplier={MAX_FONT_SCALE}>Order #{orderNumber}</Text>
                ) : null}
                <Text style={styles.message} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  Arriving during the <Text style={styles.strong}>{slotLabel}</Text> break
                  {roomCode ? ' at' : ''}
                </Text>
              </FadeInView>
              {roomCode ? (
                <FlipIn delay={450}>
                  <DoorSign code={roomCode} size="lg" style={styles.sign} />
                </FlipIn>
              ) : null}
            </View>
          ) : null}
          <FadeInView delay={550}>
            <AppButton title="Track order" icon="navigate" onPress={onTrack} />
          </FadeInView>
        </View>
      </Pressable>
    </Modal>
  );
}
