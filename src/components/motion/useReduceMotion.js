import { useApp } from '../../context/AppContext';

// Accessibility: true when the user enabled "Reduce Motion" (read once in AppContext)
export default function useReduceMotion() {
  const app = useApp();
  return Boolean(app && app.reduceMotion);
}
