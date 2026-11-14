import * as Haptics from 'expo-haptics';

// Small wrappers so a missing haptic engine (e.g. web) never crashes the app
const safe = (fn) => {
  try {
    fn().catch(() => {});
  } catch (error) {
    // no haptics available
  }
};

export const tap = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const success = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const warning = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
export const error = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
