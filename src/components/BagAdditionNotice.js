import React from 'react';
import { Text, View } from 'react-native';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import useThemedStyles from '../hooks/useThemedStyles';
import { darkColors, MAX_FONT_SCALE } from '../theme/theme';
import PressableScale from './motion/PressableScale';
import { useToast } from './motion/Toast';
import { createStyles } from './motion/Toast.styles';
import useReduceMotion from './motion/useReduceMotion';

const enter = FadeIn.duration(180);
const exit = FadeOut.duration(160);

export default function BagAdditionNotice({ scope, focused, onView }) {
  const { bagAddition, dismissBagAddition } = useToast();
  const styles = useThemedStyles(createStyles);
  const reduceMotion = useReduceMotion();
  const addition = focused && bagAddition?.scope === scope ? bagAddition : null;
  if (!addition) return null;

  const message = addition.filename
    ? 'Document added to bag'
    : `Added ${addition.quantity} \u00d7 ${addition.name} to bag`;

  return (
    <Reanimated.View
      style={styles.bagLane}
      pointerEvents="box-none"
      entering={reduceMotion ? undefined : enter}
      exiting={reduceMotion ? undefined : exit}
    >
      <View style={[styles.toast, styles.bagToast]}>
        <Ionicons name="checkmark-circle" size={20} color={darkColors.success} />
        <View style={styles.bagText} accessibilityLiveRegion="polite">
          <Text style={styles.bagMessage} numberOfLines={addition.filename ? 1 : 2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {message}
          </Text>
          {addition.filename ? (
            <Text style={styles.bagFilename} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {addition.filename}
            </Text>
          ) : null}
        </View>
        <PressableScale
          style={[styles.action, styles.bagAction]}
          accessibilityLabel="View bag"
          onPress={() => {
            dismissBagAddition();
            onView();
          }}
        >
          <Text style={styles.actionText} maxFontSizeMultiplier={MAX_FONT_SCALE}>View</Text>
        </PressableScale>
      </View>
    </Reanimated.View>
  );
}
