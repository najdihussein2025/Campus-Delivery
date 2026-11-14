import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import { colors, MAX_FONT_SCALE } from '../theme/theme';
import styles from './StepIndicator.styles';

// Horizontal stepper (e.g. Where → When → Pay): ✓ when complete, UA blue for the current step
export default function StepIndicator({ steps = [], current = 0, completed = [], onStepPress, style }) {
  return (
    <View style={[styles.row, style]}>
      {steps.map((step, i) => {
        const done = Boolean(completed[i]);
        const active = i === current;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={step}>
            <PressableScale
              onPress={() => onStepPress && onStepPress(i)}
              disabled={!onStepPress}
              accessibilityLabel={`Step ${i + 1}, ${step}${done ? ', complete' : ''}`}
              accessibilityState={{ selected: active }}
              style={styles.step}
            >
              <View style={[styles.circle, done && styles.circleDone, active && !done && styles.circleActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={16} color={colors.textOnDark} />
                ) : (
                  <Text style={[styles.number, active && styles.numberActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.label, (active || done) && styles.labelActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {step}
              </Text>
            </PressableScale>
            {!isLast ? <View style={[styles.connector, done && styles.connectorDone]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}
