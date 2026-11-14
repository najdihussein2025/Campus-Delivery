import React, { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import SectionHeader from '../../components/SectionHeader';
import { FadeInView, animateLayout, useToast } from '../../components/motion';
import {
  DEFAULT_PREFS, LEAD_OPTIONS, cancelNotifications, getPermission, loadPrefs, openSystemSettings, requestPermission,
  savePrefs, sendTestNotification,
} from '../../services/notifications';
import { getOrderStatus } from '../../utils/orderStatus';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { createStyles } from './NotificationsScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

// Notifications settings: permission status, order updates, break reminders (+ lead time) and a test button
export default function NotificationsScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { orders, syncBreakReminders, syncOrderNotifications } = useApp();
  const { showToast } = useToast();
  const [permission, setPermission] = useState({ granted: false, canAskAgain: true, status: 'undetermined' });
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const refreshPermission = useCallback(async () => setPermission(await getPermission()), []);

  useEffect(() => {
    refreshPermission();
    loadPrefs().then(setPrefs);
    // Coming back from the system settings: read the permission again (listener removed in cleanup)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const turnOn = async () => {
    const granted = await requestPermission();
    await refreshPermission();
    if (granted) {
      await syncOrderNotifications();
      await syncBreakReminders();
      showToast({ message: 'Notifications are on', icon: 'notifications', tone: 'success' });
    }
  };

  const update = async (changes) => {
    const next = { ...prefs, ...changes };
    setPrefs(next);
    await savePrefs(next);
  };

  const toggleOrders = async (value) => {
    animateLayout();
    await update({ orders: value });
    if (value) await syncOrderNotifications();
    else {
      // Turned off: cancel what is already scheduled for orders in progress
      const active = orders.filter((o) => !o.cancelled && getOrderStatus(o, Date.now()) !== 'Delivered');
      await Promise.all(active.map((o) => cancelNotifications(o.notificationIds || [])));
    }
  };

  const toggleBreaks = async (value) => {
    animateLayout();
    await update({ breaks: value });
    await syncBreakReminders();
  };

  const chooseLead = async (lead) => {
    await update({ lead });
    await syncBreakReminders();
  };

  const sendTest = async () => {
    const ok = await sendTestNotification();
    showToast(
      ok
        ? { message: 'Sent! It arrives in 5 seconds. Lock your phone to check.', icon: 'paper-plane', tone: 'success', duration: 4000 }
        : { message: 'Could not schedule the test notification', icon: 'alert-circle', tone: 'error' }
    );
  };

  const off = !permission.granted;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Card style={[styles.statusCard, off ? styles.statusOff : styles.statusOn]}>
          <Ionicons
            name={off ? 'notifications-off' : 'notifications'}
            size={26}
            color={off ? colors.warningText : colors.successText}
          />
          <View style={styles.statusText}>
            <Text style={[styles.statusTitle, off ? styles.statusTitleOff : styles.statusTitleOn]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {off ? 'Notifications are off for CampusGo' : 'Notifications are on'}
            </Text>
            <Text style={styles.statusSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {off
                ? 'You will not hear about your order while the app is closed.'
                : 'Updates arrive even when the app is closed or the phone is locked.'}
            </Text>
          </View>
        </Card>
        {off ? (
          permission.status !== 'denied' && permission.canAskAgain ? (
            <AppButton title="Turn on notifications" icon="notifications" onPress={turnOn} style={styles.statusButton} />
          ) : (
            <AppButton title="Open settings" icon="settings-outline" onPress={openSystemSettings} style={styles.statusButton} />
          )
        ) : null}
      </FadeInView>

      <SectionHeader title="What to send" />
      <Card>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Order updates</Text>
            <Text style={styles.rowSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>Preparing, on the way and delivered</Text>
          </View>
          <Switch
            value={prefs.orders}
            onValueChange={toggleOrders}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel="Order updates"
          />
        </View>
        <View style={[styles.row, styles.rowDivider]}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Remind me before breaks</Text>
            <Text style={styles.rowSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>On weekdays, so you can order in time</Text>
          </View>
          <Switch
            value={prefs.breaks}
            onValueChange={toggleBreaks}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel="Remind me before breaks"
          />
        </View>
        {prefs.breaks ? (
          <View style={styles.leadBlock}>
            <Text style={styles.leadLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Remind me this long before</Text>
            <View style={styles.leadRow}>
              {LEAD_OPTIONS.map((minutes) => (
                <Chip key={minutes} label={`${minutes} min`} selected={prefs.lead === minutes} onPress={() => chooseLead(minutes)} />
              ))}
            </View>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Try it" />
      <Card>
        <Text style={styles.rowSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          Sends one notification in 5 seconds. Lock the phone right after tapping, to check it arrives.
        </Text>
        <AppButton
          title="Send a test notification"
          icon="paper-plane-outline"
          variant="secondary"
          onPress={sendTest}
          disabled={off}
          reason="Turn on notifications first."
          style={styles.testButton}
        />
      </Card>
    </ScrollView>
  );
}
