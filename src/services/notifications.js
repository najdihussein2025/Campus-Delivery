// Local scheduled notifications (no backend): the OS delivers them even when the app is closed.
// Every OS call is wrapped so a notification problem can never crash the app (e.g. on web or in Expo Go quirks).
import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildBreakReminders, buildOrderPlan } from '../utils/notificationPlan';

const KEYS = { prefs: 'campusgo:notifPrefs', asked: 'campusgo:notifAsked' };
export const DEFAULT_PREFS = { orders: true, breaks: false, lead: 15 };
export const LEAD_OPTIONS = [10, 15, 20];

const supported = Platform.OS !== 'web';

// What the user is looking at right now: the foreground rule hides banners for the order being watched
const viewing = { screen: null, orderId: null };
export const setViewing = (screen, orderId = null) => {
  viewing.screen = screen;
  viewing.orderId = orderId;
};

// Runs once in App.js: foreground handler + Android channels
export const configureNotifications = async () => {
  if (!supported) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data || {};
        const watching = viewing.screen === 'Tracking' && data.kind === 'order' && data.orderId === viewing.orderId;
        return {
          shouldShowBanner: !watching,
          shouldShowList: !watching,
          shouldPlaySound: !watching,
          shouldSetBadge: false,
        };
      },
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#005BAA',
      });
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Break reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  } catch (error) {
    console.log('Notification setup failed', error.message);
  }
};

// ---------- Preferences ----------
export const loadPrefs = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.prefs);
    return { ...DEFAULT_PREFS, ...(raw ? JSON.parse(raw) : {}) };
  } catch (error) {
    return DEFAULT_PREFS;
  }
};

export const savePrefs = async (prefs) => {
  try {
    await AsyncStorage.setItem(KEYS.prefs, JSON.stringify(prefs));
  } catch (error) {
    console.log('Prefs write failed', error.message);
  }
};

// Whether the "turn on notifications" sheet was already shown (never ask automatically twice)
export const wasAsked = async () => {
  try {
    return (await AsyncStorage.getItem(KEYS.asked)) === 'true';
  } catch (error) {
    return true;
  }
};
export const markAsked = async () => {
  try {
    await AsyncStorage.setItem(KEYS.asked, 'true');
  } catch (error) {
    console.log('Asked flag write failed', error.message);
  }
};

// ---------- Permission ----------
// Returns { granted, canAskAgain, status }
export const getPermission = async () => {
  if (!supported) return { granted: false, canAskAgain: false, status: 'unsupported' };
  try {
    const p = await Notifications.getPermissionsAsync();
    return { granted: p.granted, canAskAgain: p.canAskAgain, status: p.status };
  } catch (error) {
    return { granted: false, canAskAgain: false, status: 'unavailable' };
  }
};

export const requestPermission = async () => {
  if (!supported) return false;
  try {
    const p = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return p.granted;
  } catch (error) {
    console.log('Permission request failed', error.message);
    return false;
  }
};

export const openSystemSettings = () => Linking.openSettings();

// ---------- Orders ----------
// Hands the Preparing / On the way / Delivered notifications to the OS. Returns the scheduled ids.
export const scheduleOrderNotifications = async (details) => {
  if (!supported) return [];
  try {
    const prefs = await loadPrefs();
    const permission = await getPermission();
    if (!prefs.orders || !permission.granted) return [];
    const plan = buildOrderPlan({ ...details, nowMs: Date.now() });
    const ids = [];
    for (const item of plan) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          sound: true,
          data: { kind: 'order', orderId: details.order.id, step: item.step },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: item.seconds,
          channelId: 'orders',
        },
      });
      ids.push(id);
    }
    return ids;
  } catch (error) {
    console.log('Order notifications not scheduled', error.message);
    return [];
  }
};

export const cancelNotifications = async (ids = []) => {
  if (!supported) return;
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch((e) => console.log('Cancel failed', e.message)))
  );
};

// Opening Tracking clears that order's notifications that are already in the tray
export const dismissOrderNotifications = async (orderId) => {
  if (!supported) return;
  try {
    const shown = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      shown
        .filter((n) => (n.request.content.data || {}).orderId === orderId)
        .map((n) => Notifications.dismissNotificationAsync(n.request.identifier))
    );
  } catch (error) {
    console.log('Dismiss skipped', error.message);
  }
};

// Log out: nothing of this user should fire any more
export const cancelAllNotifications = async () => {
  if (!supported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.log('Cancel all failed', error.message);
  }
};

// ---------- Break reminders ----------
// Idempotent: cancels every scheduled "break" notification, then schedules them again from the current settings
let breakChain = Promise.resolve();
// Calls are queued one after another, so two overlapping calls can never schedule duplicates
export const rescheduleBreakReminders = (args) => {
  breakChain = breakChain.then(() => doRescheduleBreaks(args));
  return breakChain;
};

const doRescheduleBreaks = async ({ slots, busySlotIds = [] }) => {
  if (!supported || !slots || slots.length === 0) return 0;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content.data || {}).kind === 'break')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
    const prefs = await loadPrefs();
    const permission = await getPermission();
    if (!prefs.breaks || !permission.granted) return 0;
    const reminders = buildBreakReminders(slots, new Date(), prefs.lead, busySlotIds);
    for (const r of reminders) {
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body, sound: true, data: { kind: 'break', slotId: r.slotId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: 'reminders' },
      });
    }
    return reminders.length;
  } catch (error) {
    console.log('Break reminders not scheduled', error.message);
    return 0;
  }
};

// "Send a test notification": arrives in 5 seconds so you can lock the phone and check
export const sendTestNotification = async () => {
  if (!supported) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: '🔔 CampusGo test', body: 'Notifications work, even with the app closed.', sound: true, data: { kind: 'test' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: 'orders' },
    });
    return true;
  } catch (error) {
    console.log('Test notification failed', error.message);
    return false;
  }
};

// ---------- Taps ----------
// Turns a tapped notification into a navigation target: { kind: 'order', orderId } | { kind: 'break' } | null
export const targetFromResponse = (response) => {
  const data = response?.notification?.request?.content?.data || {};
  if (data.kind === 'order' && data.orderId) return { kind: 'order', orderId: data.orderId };
  if (data.kind === 'break') return { kind: 'break' };
  return null;
};

export const addResponseListener = (listener) =>
  supported ? Notifications.addNotificationResponseReceivedListener(listener) : { remove: () => {} };

export const getLastResponse = async () => {
  if (!supported) return null;
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch (error) {
    return null;
  }
};
