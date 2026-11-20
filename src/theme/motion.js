// Motion tokens (Material 3 style). Use these instead of magic numbers.
import { Easing } from 'react-native-reanimated';
import { Easing as RNEasing } from 'react-native';

export const durations = { instant: 50, short: 150, medium: 250, long: 400, extraLong: 600 };

// Reanimated easings (UI thread, worklet safe)
export const easings = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasizedDecel: Easing.bezier(0.05, 0.7, 0.1, 1),
  emphasizedAccel: Easing.bezier(0.3, 0, 0.8, 0.15),
};

// The same curves for the classic Animated API (components that were not migrated)
export const rnEasings = {
  standard: RNEasing.bezier(0.2, 0, 0, 1),
  emphasizedDecel: RNEasing.bezier(0.05, 0.7, 0.1, 1),
  emphasizedAccel: RNEasing.bezier(0.3, 0, 0.8, 0.15),
};

export const springs = {
  snappy: { damping: 18, stiffness: 220 },
  bouncy: { damping: 12, stiffness: 180 },
  gentle: { damping: 20, stiffness: 120 },
};

// Reduce Motion: every animation becomes a cross-fade of at most this long, or is skipped
export const REDUCED_FADE_MS = 150;
