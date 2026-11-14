import { useCallback, useEffect, useRef, useState } from 'react';
import { navigationRef } from '../navigation/navigationRef';
import { addResponseListener, getLastResponse, targetFromResponse } from '../services/notifications';

// Responses already handled in this app session (the "last response" API can return the same tap twice)
const handled = new Set();

// Tapping a notification opens Tracking for that order (or Home for a break reminder), whether the app was
// in the background (listener) or closed (cold start: getLastNotificationResponseAsync, checked once).
// Navigation waits until the container is ready AND the user is logged in; a logged-out tap opens after login.
export default function useNotificationNavigation(user) {
  const pending = useRef(null);
  const userRef = useRef(user);
  const [navReady, setNavReady] = useState(false);
  userRef.current = user;

  const tryNavigate = useCallback(() => {
    const target = pending.current;
    if (!target || !navigationRef.isReady() || !userRef.current) return;
    pending.current = null;
    if (target.kind === 'order') navigationRef.navigate('Tracking', { orderId: target.orderId });
    else navigationRef.navigate('MainTabs', { screen: 'Home' });
  }, []);

  const accept = useCallback(
    (response) => {
      if (!response) return;
      const id = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handled.has(id)) return;
      const target = targetFromResponse(response);
      if (!target) return;
      handled.add(id);
      pending.current = target;
      tryNavigate();
    },
    [tryNavigate]
  );

  useEffect(() => {
    const subscription = addResponseListener(accept);
    getLastResponse().then(accept);
    return () => subscription.remove();
  }, [accept]);

  // Container became ready, or the user just logged in: give the screens a moment to mount, then navigate
  useEffect(() => {
    const timer = setTimeout(tryNavigate, 300);
    return () => clearTimeout(timer);
  }, [user, navReady, tryNavigate]);

  return { onReady: () => setNavReady(true) };
}
