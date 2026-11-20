import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Small wrappers so a missing haptic engine (e.g. web) never crashes the app.
// Haptics are silently skipped on web and when the phone's Reduce Motion setting is on (AppContext calls setHapticsEnabled).
let enabled = Platform.OS !== 'web';
export const setHapticsEnabled = (value) => {
  enabled = Platform.OS !== 'web' && Boolean(value);
};

const safe = (fn) => {
  if (!enabled) return;
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch (error) {
    // no haptics available
  }
};

export const tap = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const success = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const error = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
