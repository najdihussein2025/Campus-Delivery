import { useReducedMotion } from 'react-native-reanimated';
import { useApp } from '../../context/AppContext';

// Accessibility: true when "Reduce Motion" is on (phone setting read in AppContext, or Reanimated's own system flag).
// New animations check this: no large movement, scaling, spinning, parallax or confetti, only a short fade or nothing.
export default function useReduceMotion() {
  const app = useApp();
  const system = useReducedMotion();
  return Boolean((app && app.reduceMotion) || system);
}
