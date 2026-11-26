import { useState } from 'react';
import { animateLayout } from '../components/motion';
import { useApp } from '../context/AppContext';

// Dietary filter state for a screen. With `useMyDiet` the user's saved diet is applied on open and shown as a
// removable "My diet" chip; removing it only clears it for this visit (the saved setting is untouched).
export default function useDietFilter({ useMyDiet = false, allowedTags } = {}) {
  const { user } = useApp();
  const myDiet = (user && user.myDiet) || [];
  const [selected, setSelected] = useState(() =>
    useMyDiet ? myDiet.filter((tag) => !allowedTags || allowedTags.includes(tag)) : []
  );
  const [fromDiet, setFromDiet] = useState(useMyDiet && myDiet.length > 0);

  const toggle = (tag) => {
    animateLayout();
    setFromDiet(false);
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  // Turn one tag on (used by the season banners)
  const turnOn = (tag) => {
    animateLayout();
    setFromDiet(false);
    setSelected((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  };

  const apply = (tags) => {
    animateLayout();
    setFromDiet(false);
    setSelected(tags);
  };

  const clear = () => apply([]);

  return { selected, toggle, turnOn, apply, clear, myDiet, showMyDiet: fromDiet && selected.length > 0 };
}
