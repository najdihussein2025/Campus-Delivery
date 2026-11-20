import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import useReduceMotion from './motion/useReduceMotion';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './QuantitySelector.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Stepper: the number bumps on change; at the minimum the minus turns into a trash icon
// allowRemove=false: at the minimum the minus stays a (disabled) minus, e.g. on the product sheet before anything is added
export default function QuantitySelector({ qty, onIncrease, onDecrease, min = 1, small = false, allowRemove = true, disabled = false }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const bump = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  const atMin = qty <= min && allowRemove;
  const minusDisabled = disabled || (qty <= min && !allowRemove);
  const iconSize = small ? 15 : 18;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    bump.setValue(1.3);
    Animated.spring(bump, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();
  }, [qty]);

  return (
    <View style={[styles.row, small && styles.rowSmall]}>
      <PressableScale
        onPress={onDecrease}
        hitSlop={8}
        haptic
        disabled={minusDisabled}
        accessibilityLabel={atMin ? 'Remove item' : 'Decrease quantity'}
        accessibilityState={{ disabled: minusDisabled }}
        style={[styles.btn, small && styles.btnSmall, minusDisabled && styles.btnDisabled]}
      >
        <Ionicons name={atMin ? 'trash-outline' : 'remove'} size={iconSize} color={minusDisabled ? colors.textMuted : atMin ? colors.dangerText : colors.primary} />
      </PressableScale>
      <Animated.Text
        style={[styles.qty, small && styles.qtySmall, { transform: [{ scale: bump }] }]}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        accessibilityLabel={`Quantity ${qty}`}
      >
        {qty}
      </Animated.Text>
      <PressableScale
        onPress={onIncrease}
        hitSlop={8}
        haptic
        disabled={disabled}
        accessibilityLabel="Increase quantity"
        accessibilityState={{ disabled }}
        style={[styles.btn, styles.btnPlus, small && styles.btnSmall, disabled && styles.btnDisabled]}
      >
        <Ionicons name="add" size={iconSize} color={colors.textOnDark} />
      </PressableScale>
    </View>
  );
}
