import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';
import { useToast } from './motion';
import { getPermission, markAsked, requestPermission, wasAsked } from '../services/notifications';

// Pre-permission sheet: shown once, after the first order, never on first launch.
// Only "Turn on" triggers the real system prompt.
export default function NotificationPrompt() {
  const { syncOrderNotifications } = useApp();
  const { showToast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const [asked, permission] = await Promise.all([wasAsked(), getPermission()]);
      if (alive && !asked && !permission.granted && permission.canAskAgain) setVisible(true);
    };
    check();
    return () => {
      alive = false;
    };
  }, []);

  const notNow = async () => {
    setVisible(false);
    await markAsked();
  };

  const turnOn = async () => {
    setVisible(false);
    await markAsked();
    const granted = await requestPermission();
    if (granted) {
      await syncOrderNotifications();
      showToast({ message: 'Notifications are on', icon: 'notifications', tone: 'success' });
    }
  };

  return (
    <ConfirmModal
      visible={visible}
      icon="notifications"
      title="Get notified when your order is on the way"
      message="Even if the app is closed. You can change this any time in Profile → Notifications."
      confirmLabel="Turn on"
      cancelLabel="Not now"
      onConfirm={turnOn}
      onCancel={notNow}
    />
  );
}
