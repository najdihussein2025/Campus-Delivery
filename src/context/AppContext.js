import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCampusData } from '../services/api';
import { calcCartTotals } from '../utils/money';
import { DEFAULT_SPEED, buildStatusSchedule, getOrderStatus, secondsForSpeed } from '../utils/orderStatus';
import { dateKey } from '../utils/calendar';
import { findAccount } from '../utils/validation';
import { formatTime, getNow, getOrderingBlock, offsetForDateTime } from '../utils/time';
import {
  canUseReward, consumeReward, emptyLoyalty, refundReward, rewardDiscount, settleDeliveredOrders, willCompleteCard,
} from '../utils/loyalty';
import { activeSeasons } from '../utils/diet';
import { setHapticsEnabled } from '../utils/haptics';
import { buildDemoSeed } from '../utils/demoSeed';
import {
  cancelAllNotifications, cancelNotifications, rescheduleBreakReminders, scheduleOrderNotifications,
} from '../services/notifications';

const AppContext = createContext(null);

const KEYS = {
  users: 'campusgo:users',
  session: 'campusgo:session',
  demoOffset: 'campusgo:demoOffset',
  onboarding: 'campusgo:onboardingDone',
  trackingSpeed: 'campusgo:trackingSpeed',
  dismissedSeasons: 'campusgo:dismissedSeasons',
  demoSeeded: 'campusgo:demoSeeded',
  loyalty: (email) => `campusgo:loyalty:${email.toLowerCase()}`,
  data: (email) => `campusgo:data:${email.toLowerCase()}`,
};

const EMPTY_CART = { storeId: null, items: [] };

const makeId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

// `at` = demo-clock time in ms, so wallet times match the clock shown in the app
const makeTransaction = (type, amount, label, at = Date.now()) => ({
  id: makeId('t'),
  type,
  amount,
  label,
  date: at,
});

const DEMO_USER = {
  name: 'Demo Student',
  email: 'student@ua.edu.lb',
  password: 'campus123',
  studentId: '20231234',
  faculty: 'Faculty of Engineering and Technology',
  campusId: 'baabda',
  phone: '71123456',
};

const DEMO_LOCATION = { id: 'loc1', label: 'My Lab', buildingId: 'baabda-D', room: 'D.2.8' };

// Old buildings were "bA".."bF" with free-text rooms: map them to the real Hadat–Baabda buildings
const LEGACY_BUILDINGS = { bA: 'baabda-A', bB: 'baabda-B', bC: 'baabda-C', bD: 'baabda-D', bE: 'baabda-G', bF: 'baabda-S' };

const migrateUser = (u) => {
  const next = { ...u, campusId: u.campusId || 'baabda' };
  if (u.email === DEMO_USER.email && u.faculty === 'Engineering') next.faculty = DEMO_USER.faculty;
  return next;
};

// Before the real UA timetable (v3) the breaks were different. Old orders keep the label they were placed with.
const LEGACY_SLOTS = {
  s1: { start: '09:45', end: '10:00', label: '09:45–10:00' },
  s2: { start: '11:15', end: '11:30', label: '11:15–11:30' },
  s3: { start: '12:45', end: '13:30', label: '12:45–13:30' },
  s4: { start: '14:00', end: '14:15', label: '14:00–14:15' },
  s5: { start: '15:15', end: '15:30', label: '15:15–15:30' },
  s6: { start: '16:15', end: '16:30', label: '16:15–16:30' },
};

// Orders saved before the time-based status / loyalty existed get the new fields (no retroactive stamps)
const migrateOrder = (o) => ({
  ...o,
  ...(o.slotLabel || !LEGACY_SLOTS[o.slotId]
    ? {}
    : { slotLabel: LEGACY_SLOTS[o.slotId].label, slotStart: LEGACY_SLOTS[o.slotId].start, slotEnd: LEGACY_SLOTS[o.slotId].end }),
  placedAtMs: o.placedAtMs ?? o.createdAt,
  placedAt: o.placedAt ?? o.createdAt,
  gross: o.gross ?? o.subtotal,
  stampsCredited: o.stampsCredited ?? true,
  notificationIds: o.notificationIds || [],
});

const migrateData = (data) => {
  const savedLocations = (data.savedLocations || []).map((loc) => {
    if (loc.id === 'loc1' && loc.buildingId === 'bE' && loc.room === '204') return DEMO_LOCATION;
    return LEGACY_BUILDINGS[loc.buildingId] ? { ...loc, buildingId: LEGACY_BUILDINGS[loc.buildingId] } : loc;
  });
  return { ...data, savedLocations, orders: (data.orders || []).map(migrateOrder) };
};

const newUserData = (credit, savedLocations = [], at = Date.now()) => ({
  cart: EMPTY_CART,
  wallet: { balance: credit, transactions: [makeTransaction('topup', credit, 'Welcome credit', at)] },
  orders: [],
  savedLocations,
});


// Chapter 20: AsyncStorage with async/await and try/catch
const readJson = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.log('Read failed', key, error);
    return fallback;
  }
};

const writeJson = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.log('Write failed', key, error);
  }
};

const isDemo = (email) => email.toLowerCase() === DEMO_USER.email;

// Demo account data: ~3 weeks of delivered orders + wallet history + a card at 8/10 stamps
const buildDemoBundle = (campusData, offsetMs) => {
  const seed = buildDemoSeed(campusData, getNow(offsetMs).getTime(), offsetMs);
  return {
    data: { ...newUserData(0, [DEMO_LOCATION]), orders: seed.orders, wallet: seed.wallet },
    loyalty: seed.loyalty,
  };
};

export function AppProvider({ children }) {
  const [campus, setCampus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(EMPTY_CART);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(emptyLoyalty());
  const [useReward, setUseReward] = useState(false);
  const [lastSettlement, setLastSettlement] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [timeOffsetMs, setTimeOffsetMs] = useState(0);
  const [trackingSpeed, setTrackingSpeedState] = useState(DEFAULT_SPEED);
  const [dismissedSeasons, setDismissedSeasons] = useState([]);
  const [dataReady, setDataReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);

  // Always-current copies, so timers and listeners (and settleDeliveredOrders) never read stale state
  const ordersRef = useRef([]);
  const loyaltyRef = useRef(emptyLoyalty());
  const campusRef = useRef(null);
  const sessionRef = useRef(0); // bumps on logout / demo reset so late async work can be dropped
  ordersRef.current = orders;
  loyaltyRef.current = loyalty;
  campusRef.current = campus;

  // Accessibility: read Reduce Motion once and follow changes (listener removed in cleanup)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // No haptics when Reduce Motion is on (and never on web, see utils/haptics.js)
  useEffect(() => {
    setHapticsEnabled(!reduceMotion);
  }, [reduceMotion]);

  const commitOrders = (next) => {
    ordersRef.current = next;
    setOrders(next);
  };
  const commitLoyalty = (next) => {
    loyaltyRef.current = next;
    setLoyalty(next);
  };

  const applyUserData = (raw, loyaltyRaw) => {
    const data = migrateData(raw);
    setCart(data.cart || EMPTY_CART);
    setWallet(data.wallet || { balance: 0, transactions: [] });
    commitOrders(data.orders || []);
    commitLoyalty(loyaltyRaw || emptyLoyalty());
    setSavedLocations(data.savedLocations || []);
    setUseReward(false);
    setDataReady(true);
  };

  // Reads one account's saved data. The demo account is seeded once if it has no orders yet.
  const loadBundle = async (account, campusData, offsetMs) => {
    let data = await readJson(KEYS.data(account.email), newUserData(0));
    let loyaltyData = await readJson(KEYS.loyalty(account.email), emptyLoyalty());
    const alreadySeeded = await readJson(KEYS.demoSeeded, false);
    if (isDemo(account.email) && (data.orders || []).length === 0 && !alreadySeeded) {
      const bundle = buildDemoBundle(campusData, offsetMs);
      // `[]` is truthy, so check the length: a fresh install stores an empty list that must not hide the seeded place
      data = {
        ...data,
        ...bundle.data,
        cart: data.cart?.items?.length ? data.cart : EMPTY_CART,
        savedLocations: data.savedLocations?.length ? data.savedLocations : bundle.data.savedLocations,
      };
      loyaltyData = bundle.loyalty;
      await writeJson(KEYS.demoSeeded, true);
    }
    return { data, loyalty: loyaltyData };
  };

  // Load campus data, accounts and the saved session once on mount
  useEffect(() => {
    const init = async () => {
      const campusData = await loadCampusData();
      setCampus(campusData);
      const offset = await readJson(KEYS.demoOffset, 0);
      setTimeOffsetMs(offset);
      setTrackingSpeedState(await readJson(KEYS.trackingSpeed, DEFAULT_SPEED));
      setDismissedSeasons(await readJson(KEYS.dismissedSeasons, []));

      let storedUsers = await readJson(KEYS.users, null);
      if (!storedUsers) {
        storedUsers = [DEMO_USER];
        await writeJson(KEYS.users, storedUsers);
      }
      storedUsers = storedUsers.map(migrateUser);
      setUsers(storedUsers);
      setOnboardingDone(await readJson(KEYS.onboarding, false));

      const sessionEmail = await readJson(KEYS.session, null);
      const sessionUser = storedUsers.find((u) => u.email === sessionEmail);
      if (sessionUser) {
        const bundle = await loadBundle(sessionUser, campusData, offset);
        applyUserData(bundle.data, bundle.loyalty);
        setUser(sessionUser);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Save the user's data whenever it changes (only after it was loaded)
  useEffect(() => {
    if (!user || !dataReady) return;
    writeJson(KEYS.data(user.email), { cart, wallet, orders, savedLocations });
  }, [cart, wallet, orders, savedLocations, user, dataReady]);

  useEffect(() => {
    if (!user || !dataReady) return;
    writeJson(KEYS.loyalty(user.email), loyalty);
  }, [loyalty, user, dataReady]);

  const refreshCampus = async () => {
    const data = await loadCampusData();
    setCampus(data);
  };

  const demoNowMs = () => getNow(timeOffsetMs).getTime();
  const getStore = (storeId) => campus?.stores.find((s) => s.id === storeId);
  const getProduct = (productId) => campus?.products.find((p) => p.id === productId);
  const getBuilding = (buildingId) =>
    campus?.buildings.find((b) => b.id === buildingId || b.id === LEGACY_BUILDINGS[buildingId]);
  const getSlot = (slotId) => campus?.deliverySlots.find((s) => s.id === slotId);
  // The break an order was placed for: the label stored on the order wins, so old orders still display correctly
  const getOrderSlot = (order) => {
    if (!order) return null;
    if (order.slotLabel) return { id: order.slotId, label: order.slotLabel, start: order.slotStart, end: order.slotEnd };
    return getSlot(order.slotId) || null;
  };
  // null when UA is open today, otherwise { reason, opensText, emoji } (weekend, holiday, semester break)
  const getClosedBlock = () => getOrderingBlock(timeOffsetMs, campus?.deliverySlots || []);
  const userCampusId = user?.campusId || 'baabda';
  const getCampus = (campusId = userCampusId) => campus?.campuses.find((c) => c.id === campusId);
  const campusBuildings = campus ? campus.buildings.filter((b) => b.campusId === userCampusId) : [];
  const getStoreLocation = (store) =>
    typeof store?.location === 'string' ? store.location : store?.location?.[userCampusId] || '';

  // "Building G · Room G.2.15" (old free-text rooms stay readable)
  const formatLocation = (buildingId, room) => {
    const building = getBuilding(buildingId);
    if (!building) return `Room ${room}`;
    return `${building.name} · Room ${room}`;
  };

  // ---------- Loyalty settlement ----------
  // Idempotent: credits every Delivered, not-yet-credited order. Runs on start, on foreground and on a timer
  // (an order can become Delivered while the app is closed).
  const settle = useCallback(() => {
    const result = settleDeliveredOrders(ordersRef.current, loyaltyRef.current, Date.now());
    if (!result.changed) return [];
    commitOrders(result.orders);
    commitLoyalty(result.loyalty);
    if (result.credited.length) setLastSettlement({ items: result.credited, at: Date.now() });
    return result.credited;
  }, []);

  // ---------- Notifications helpers ----------
  const isActiveOrder = (order, nowMs = Date.now()) =>
    !order.cancelled && getOrderStatus(order, nowMs) !== 'Delivered';

  // Break reminders are rescheduled from the current settings; today's breaks with an active order are skipped
  const syncBreakReminders = useCallback(() => {
    const c = campusRef.current;
    if (!c) return Promise.resolve(0);
    const busy = ordersRef.current.filter((o) => isActiveOrder(o)).map((o) => o.slotId);
    return rescheduleBreakReminders({ slots: c.deliverySlots, busySlotIds: busy });
  }, []);

  // Hands one order's remaining Preparing / On the way / Delivered notifications to the OS
  const scheduleNotificationsFor = async (order) => {
    const c = campusRef.current;
    if (!c) return;
    const store = c.stores.find((s) => s.id === order.storeId);
    const slot = order.slotLabel ? { label: order.slotLabel } : c.deliverySlots.find((s) => s.id === order.slotId);
    const building = c.buildings.find((b) => b.id === order.building);
    const session = sessionRef.current;
    const ids = await scheduleOrderNotifications({
      order,
      storeName: store ? store.name : 'The store',
      slotLabel: slot ? slot.label : '',
      buildingName: building ? building.name : '',
      completesCard: willCompleteCard(loyaltyRef.current, ordersRef.current, order),
    });
    const current = ordersRef.current.find((o) => o.id === order.id);
    if (session !== sessionRef.current || !current || current.cancelled) {
      cancelNotifications(ids);
      return;
    }
    commitOrders(ordersRef.current.map((o) => (o.id === order.id ? { ...o, notificationIds: ids } : o)));
  };

  // After permission is granted (or after login): schedule every active order again, replacing old ids
  const syncOrderNotifications = useCallback(async () => {
    const active = ordersRef.current.filter((o) => isActiveOrder(o));
    for (const order of active) {
      await cancelNotifications(order.notificationIds || []);
      await scheduleNotificationsFor(order);
    }
  }, []);

  // Settle on start/foreground/timer + refresh break reminders when the app opens
  useEffect(() => {
    if (!user || !dataReady) return undefined;
    settle();
    syncBreakReminders();
    const timer = setInterval(settle, 2000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        settle();
        syncBreakReminders();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [user, dataReady, settle, syncBreakReminders]);

  // ---------- Auth ----------
  const login = async (email) => {
    const account = findAccount(users, email); // email or 8-digit UA ID
    if (!account) return false;
    setDataReady(false);
    const bundle = await loadBundle(account, campus, timeOffsetMs);
    applyUserData(bundle.data, bundle.loyalty);
    await writeJson(KEYS.session, account.email);
    setUser(account);
    // Logging out cancelled the OS notifications, so schedule this user's active orders again
    setTimeout(() => syncOrderNotifications(), 500);
    return true;
  };

  const signUp = async (form) => {
    const account = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      studentId: form.studentId,
      faculty: form.faculty,
      campusId: form.campusId || 'baabda',
      phone: form.phone,
    };
    const nextUsers = [...users, account];
    setUsers(nextUsers);
    await writeJson(KEYS.users, nextUsers);
    const data = newUserData(1000, [], getNow(timeOffsetMs).getTime());
    await writeJson(KEYS.data(account.email), data);
    setDataReady(false);
    applyUserData(data, emptyLoyalty());
    await writeJson(KEYS.session, account.email);
    setUser(account);
  };

  const logout = async () => {
    sessionRef.current += 1;
    await cancelAllNotifications();
    await writeJson(KEYS.session, null);
    setDataReady(false);
    setUser(null);
    setCart(EMPTY_CART);
    commitOrders([]);
    commitLoyalty(emptyLoyalty());
    setUseReward(false);
    setWallet({ balance: 0, transactions: [] });
    setSavedLocations([]);
  };

  const updateProfile = async (fields) => {
    const updated = { ...user, ...fields };
    const nextUsers = users.map((u) => (u.email === user.email ? updated : u));
    setUsers(nextUsers);
    setUser(updated);
    await writeJson(KEYS.users, nextUsers);
  };

  // ---------- Cart (one store only) ----------
  const addToCart = (item, storeId) => {
    if (getClosedBlock()) return 'closed';
    if (cart.items.length > 0 && cart.storeId !== storeId) return 'conflict';
    setCart((prev) => {
      const existing = prev.items.find((i) => i.key === item.key);
      const items = existing
        ? prev.items.map((i) => (i.key === item.key ? { ...i, qty: i.qty + item.qty } : i))
        : [...prev.items, item];
      return { storeId, items };
    });
    return 'added';
  };

  const replaceCart = (item, storeId) => {
    if (getClosedBlock()) return;
    setCart({ storeId, items: [item] });
  };

  const changeQty = (key, qty) => {
    if (qty < 1) return;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.key === key ? { ...i, qty } : i)),
    }));
  };

  const removeItem = (key) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.key !== key);
      return { storeId: items.length ? prev.storeId : null, items };
    });
  };

  // Undo for "Removed – Undo" toast: put the item back at its old position
  const restoreItem = (item, index, storeId) => {
    setCart((prev) => {
      if (prev.items.length && prev.storeId !== storeId) return prev;
      const items = [...prev.items];
      items.splice(Math.min(index, items.length), 0, item);
      return { storeId, items };
    });
  };

  const clearCart = () => {
    setCart(EMPTY_CART);
    setUseReward(false);
  };

  // ---------- Loyalty reward in the bag ----------
  // The switch only counts while the bag still has a coffee and a reward is available
  const rewardAvailable = canUseReward(cart.items, loyalty);
  const rewardApplied = useReward && rewardAvailable;
  const rewardCents = rewardApplied ? rewardDiscount(cart.items) : 0;
  const cartTotals = calcCartTotals(cart.items, rewardCents);

  // ---------- Orders ----------
  const placeOrder = ({ buildingId, room, slotId, payment, saveLocation, locationLabel }) => {
    if (getClosedBlock()) return null; // UA is closed: no orders at all (the UI explains why)
    const totals = calcCartTotals(cart.items, rewardCents);
    if (payment === 'wallet' && wallet.balance < totals.total) return null;
    const slotInfo = campus.deliverySlots.find((s) => s.id === slotId);

    const couriers = campus.couriers;
    // The status is time-based: these real-time timestamps drive both the app and the phone notifications
    const placedAtMs = Date.now();
    const stepSeconds = secondsForSpeed(trackingSpeed);
    const order = {
      id: makeId('o'),
      number: String(placedAtMs).slice(-5),
      storeId: cart.storeId,
      items: cart.items,
      gross: totals.gross,
      discount: totals.discount,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      building: buildingId,
      room: room.trim().toUpperCase(),
      slotId,
      slotLabel: slotInfo ? slotInfo.label : '',
      slotStart: slotInfo ? slotInfo.start : '',
      slotEnd: slotInfo ? slotInfo.end : '',
      payment,
      courier: couriers[Math.floor(Math.random() * couriers.length)],
      placedAt: getNow(timeOffsetMs).getTime(),
      placedAtMs,
      createdAt: placedAtMs,
      stepSeconds,
      statusSchedule: buildStatusSchedule(placedAtMs, stepSeconds),
      notificationIds: [],
      rewardUsed: rewardApplied,
      stampsCredited: false,
      cancelled: false,
    };
    commitOrders([order, ...ordersRef.current]);
    if (rewardApplied) commitLoyalty(consumeReward(loyaltyRef.current, order.id, placedAtMs));

    if (payment === 'wallet') {
      setWallet((prev) => ({
        balance: prev.balance - order.total,
        transactions: [
          makeTransaction('payment', order.total, `Order #${order.number} · ${getStore(order.storeId)?.name}`, demoNowMs()),
          ...prev.transactions,
        ],
      }));
    }
    if (saveLocation) addLocation({ label: locationLabel || 'Saved place', buildingId, room: order.room });
    clearCart();
    scheduleNotificationsFor(order);
    syncBreakReminders();
    return order;
  };

  const cancelOrder = (orderId) => {
    const order = ordersRef.current.find((o) => o.id === orderId);
    if (!order || getOrderStatus(order, Date.now()) !== 'Received') return false;
    commitOrders(ordersRef.current.map((o) => (o.id === orderId ? { ...o, cancelled: true, cancelledAt: getNow(timeOffsetMs).getTime() } : o)));
    cancelNotifications(order.notificationIds || []);
    if (order.rewardUsed) commitLoyalty(refundReward(loyaltyRef.current, order.id, Date.now()));
    if (order.payment === 'wallet') {
      setWallet((prev) => ({
        balance: prev.balance + order.total,
        transactions: [makeTransaction('refund', order.total, `Refund · Order #${order.number}`, demoNowMs()), ...prev.transactions],
      }));
    }
    syncBreakReminders();
    return true;
  };

  const rateOrder = (orderId, stars, comment) => {
    commitOrders(ordersRef.current.map((o) => (o.id === orderId ? { ...o, rating: stars, comment: comment.trim() } : o)));
  };

  // Read-only preview for the reorder confirm sheet: { items, skipped, conflict, storeName }
  const previewReorder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { items: [], skipped: [], conflict: false };
    const items = [];
    const skipped = [];
    order.items.forEach((item) => {
      const product = item.type === 'product' ? getProduct(item.productId) : null;
      if (item.type === 'product' && !(product && product.inStock)) skipped.push(item.name);
      else items.push(item);
    });
    const conflict = cart.items.length > 0 && cart.storeId !== order.storeId;
    return { items, skipped, conflict, storeName: conflict ? getStore(cart.storeId)?.name : '' };
  };

  // Returns { conflict, storeName } or { added, skipped: [names] }. The loyalty reward is never copied.
  const reorder = (orderId, force = false) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { added: 0, skipped: [] };
    const closed = getClosedBlock();
    if (closed) return { closed: true, reason: closed.reason, opensText: closed.opensText, added: 0, skipped: [] };
    if (!force && cart.items.length > 0 && cart.storeId !== order.storeId) {
      return { conflict: true, storeName: getStore(cart.storeId)?.name };
    }
    const skipped = [];
    const available = order.items.filter((item) => {
      if (item.type !== 'product') return true;
      const product = getProduct(item.productId);
      if (product && product.inStock) return true;
      skipped.push(item.name);
      return false;
    });
    const base = force || cart.storeId !== order.storeId ? [] : cart.items;
    const items = [...base];
    available.forEach((item) => {
      const index = items.findIndex((i) => i.key === item.key);
      if (index >= 0) items[index] = { ...items[index], qty: items[index].qty + item.qty };
      else items.push({ ...item });
    });
    if (items.length) setCart({ storeId: order.storeId, items });
    setUseReward(false);
    return { added: available.length, skipped };
  };

  // ---------- Wallet ----------
  const topUp = async (amount) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    setWallet((prev) => ({
      balance: prev.balance + amount,
      transactions: [makeTransaction('topup', amount, 'Wallet top-up', demoNowMs()), ...prev.transactions],
    }));
  };

  // ---------- Saved locations ----------
  const addLocation = ({ label, buildingId, room }) => {
    setSavedLocations((prev) => [
      ...prev,
      { id: makeId('loc'), label: label.trim() || 'Saved place', buildingId, room: room.trim().toUpperCase() },
    ]);
  };

  const removeLocation = (id) => setSavedLocations((prev) => prev.filter((l) => l.id !== id));

  // ---------- Demo clock & demo settings ----------
  // Keeps the demo DATE that is already chosen and changes only the time of day
  const setDemoTime = (hhmm) => {
    const offset = offsetForDateTime(dateKey(getNow(timeOffsetMs)), hhmm);
    setTimeOffsetMs(offset);
    writeJson(KEYS.demoOffset, offset);
  };

  // Demo date (YYYY-MM-DD) + optional time; the clock keeps ticking from there
  const setDemoDate = (dateStr, hhmm) => {
    const time = hhmm || formatTime(getNow(timeOffsetMs));
    const offset = offsetForDateTime(dateStr, time);
    setTimeOffsetMs(offset);
    writeJson(KEYS.demoOffset, offset);
  };

  const resetDemoTime = () => {
    setTimeOffsetMs(0);
    writeJson(KEYS.demoOffset, 0);
  };

  // Tracking speed: Fast 8 s · Demo 20 s · Slow 60 s per step (applies to orders placed afterwards)
  const setTrackingSpeed = (speedId) => {
    setTrackingSpeedState(speedId);
    writeJson(KEYS.trackingSpeed, speedId);
  };

  // Demo account only: clears everything and seeds ~3 weeks of orders again, with the card at 8/10
  const resetDemoData = async () => {
    sessionRef.current += 1;
    await cancelAllNotifications();
    const bundle = buildDemoBundle(campus, timeOffsetMs);
    setCart(EMPTY_CART);
    setUseReward(false);
    setWallet(bundle.data.wallet);
    commitOrders(bundle.data.orders);
    commitLoyalty(bundle.loyalty);
    setSavedLocations([DEMO_LOCATION]);
    await writeJson(KEYS.demoSeeded, true);
    syncBreakReminders();
  };

  // ---------- Seasons ----------
  const currentSeasons = campus ? activeSeasons(campus.seasons, getNow(timeOffsetMs)) : [];
  const visibleSeasons = currentSeasons.filter((s) => !dismissedSeasons.includes(`${s.id}:${s.start}`));
  const dismissSeason = (season) => {
    const next = [...dismissedSeasons, `${season.id}:${season.start}`];
    setDismissedSeasons(next);
    writeJson(KEYS.dismissedSeasons, next);
  };

  const completeOnboarding = () => {
    setOnboardingDone(true);
    writeJson(KEYS.onboarding, true);
  };

  const value = {
    campus,
    loading,
    reduceMotion,
    onboardingDone,
    completeOnboarding,
    userCampusId,
    campusBuildings,
    getCampus,
    getStoreLocation,
    formatLocation,
    restoreItem,
    previewReorder,
    users,
    user,
    isDemoAccount: user ? isDemo(user.email) : false,
    cart,
    cartTotals,
    wallet,
    orders,
    loyalty,
    lastSettlement,
    settle,
    rewardAvailable,
    rewardApplied,
    rewardCents,
    useReward,
    setUseReward,
    savedLocations,
    timeOffsetMs,
    trackingSpeed,
    setTrackingSpeed,
    resetDemoData,
    seasons: currentSeasons,
    visibleSeasons,
    dismissSeason,
    syncBreakReminders,
    syncOrderNotifications,
    refreshCampus,
    getStore,
    getProduct,
    getBuilding,
    getSlot,
    getOrderSlot,
    getClosedBlock,
    setDemoDate,
    login,
    signUp,
    logout,
    updateProfile,
    addToCart,
    replaceCart,
    changeQty,
    removeItem,
    clearCart,
    placeOrder,
    cancelOrder,
    rateOrder,
    reorder,
    topUp,
    addLocation,
    removeLocation,
    setDemoTime,
    resetDemoTime,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
