import { AccessibilityInfo, LayoutAnimation, Platform, UIManager } from 'react-native';

// Android needs this flag once before LayoutAnimation works
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((value) => {
    reduceMotion = value;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
  reduceMotion = value;
});

// Call right before a state change: the layout change (chips, collapse, remove) animates smoothly
export const animateLayout = () => {
  if (reduceMotion) return;
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
};
