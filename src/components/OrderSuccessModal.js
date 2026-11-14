import React, { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import DoorSign from './DoorSign';
import FadeInView from './motion/FadeInView';
import SuccessCheck from './motion/SuccessCheck';
import { success } from '../utils/haptics';
import { MAX_FONT_SCALE } from '../theme/theme';
import styles from './OrderSuccessModal.styles';

// Full-screen "Order placed" moment shown before tracking (fade Modal + SuccessCheck + success haptic)
export default function OrderSuccessModal({ visible, orderNumber, slotLabel, roomCode, onTrack }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) success();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onTrack}>
      <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        {visible ? (
          <View style={styles.center}>
            <SuccessCheck size={96} />
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
              {roomCode ? <DoorSign code={roomCode} size="lg" style={styles.sign} /> : null}
            </FadeInView>
          </View>
        ) : null}
        <FadeInView delay={550}>
          <AppButton title="Track order" icon="navigate" onPress={onTrack} />
        </FadeInView>
      </View>
    </Modal>
  );
}
