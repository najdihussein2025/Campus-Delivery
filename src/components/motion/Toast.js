import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MAX_FONT_SCALE } from '../../theme/theme';
import PressableScale from './PressableScale';
import useReduceMotion from './useReduceMotion';
import styles from './Toast.styles';

const ToastContext = createContext({ showToast: () => {} });

const TONE_ICONS = { default: 'information-circle', success: 'checkmark-circle', error: 'alert-circle' };
const TONE_COLORS = { default: colors.accent, success: '#3DDC84', error: '#FF6B70' };

// Context provider: any screen calls showToast(...) and a toast slides up above the tab bar
export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const hide = () => {
    Animated.timing(anim, { toValue: 0, duration: reduceMotion ? 0 : 200, useNativeDriver: true }).start(() => setToast(null));
  };

  const showToast = ({ message, icon, tone = 'default', actionLabel, onAction, duration = 2500 }) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast({ message, icon, tone, actionLabel, onAction, id: Date.now() });
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: reduceMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    hideTimer.current = setTimeout(hide, duration);
  };

  // Chapter 19: clear the pending timer when the provider unmounts
  useEffect(() => () => hideTimer.current && clearTimeout(hideTimer.current), []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  const handleAction = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (toast && toast.onAction) toast.onAction();
    hide();
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <Animated.View
            pointerEvents="box-none"
            style={[styles.container, { bottom: insets.bottom + 84, opacity: anim, transform: [{ translateY }] }]}
          >
            <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <Ionicons name={toast.icon || TONE_ICONS[toast.tone]} size={20} color={TONE_COLORS[toast.tone] || colors.accent} />
              <Text style={styles.message} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {toast.message}
              </Text>
              {toast.actionLabel ? (
                <PressableScale onPress={handleAction} style={styles.action} hitSlop={8} accessibilityLabel={toast.actionLabel}>
                  <Text style={styles.actionText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{toast.actionLabel}</Text>
                </PressableScale>
              ) : null}
            </View>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
