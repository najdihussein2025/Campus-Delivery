import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCampusData } from '../services/api';
import { calcCartTotals } from '../utils/money';
import { getOrderStatus } from '../utils/orderStatus';
import { offsetForTime } from '../utils/time';

const AppContext = createContext(null);

const KEYS = {
  users: 'campusgo:users',
  session: 'campusgo:session',
  demoOffset: 'campusgo:demoOffset',
  onboarding: 'campusgo:onboardingDone',
  data: (email) => `campusgo:data:${email.toLowerCase()}`,
};

const EMPTY_CART = { storeId: null, items: [] };

const makeId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const makeTransaction = (type, amount, label) => ({
  id: makeId('t'),
  type,
  amount,
  label,
  date: Date.now(),
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

const migrateData = (data) => {
  const savedLocations = (data.savedLocations || []).map((loc) => {
    if (loc.id === 'loc1' && loc.buildingId === 'bE' && loc.room === '204') return DEMO_LOCATION;
    return LEGACY_BUILDINGS[loc.buildingId] ? { ...loc, buildingId: LEGACY_BUILDINGS[loc.buildingId] } : loc;
  });
  return { ...data, savedLocations };
};

const newUserData = (credit, savedLocations = []) => ({
  cart: EMPTY_CART,
  wallet: { balance: credit, transactions: [makeTransaction('topup', credit, 'Welcome credit')] },
  orders: [],
  savedLocations,
});

const DEMO_DATA = () =>
  newUserData(2500, [DEMO_LOCATION]);

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

export function AppProvider({ children }) {
  const [campus, setCampus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(EMPTY_CART);
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [orders, setOrders] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [timeOffsetMs, setTimeOffsetMs] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true);

  // Accessibility: read Reduce Motion once and follow changes (listener removed in cleanup)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const applyUserData = (raw) => {
    const data = migrateData(raw);
    setCart(data.cart || EMPTY_CART);
    setWallet(data.wallet || { balance: 0, transactions: [] });
    setOrders(data.orders || []);
    setSavedLocations(data.savedLocations || []);
    setDataReady(true);
  };

  // Load campus data, accounts and the saved session once on mount
  useEffect(() => {
    const init = async () => {
      const data = await loadCampusData();
      setCampus(data);

      let storedUsers = await readJson(KEYS.users, null);
      if (!storedUsers) {
        storedUsers = [DEMO_USER];
        await writeJson(KEYS.users, storedUsers);
        await writeJson(KEYS.data(DEMO_USER.email), DEMO_DATA());
      }
      storedUsers = storedUsers.map(migrateUser);
      setUsers(storedUsers);
      setOnboardingDone(await readJson(KEYS.onboarding, false));
      setTimeOffsetMs(await readJson(KEYS.demoOffset, 0));

      const sessionEmail = await readJson(KEYS.session, null);
      const sessionUser = storedUsers.find((u) => u.email === sessionEmail);
      if (sessionUser) {
        applyUserData(await readJson(KEYS.data(sessionUser.email), newUserData(0)));
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

  const refreshCampus = async () => {
    const data = await loadCampusData();
    setCampus(data);
  };

  const getStore = (storeId) => campus?.stores.find((s) => s.id === storeId);
  const getProduct = (productId) => campus?.products.find((p) => p.id === productId);
  const getBuilding = (buildingId) =>
    campus?.buildings.find((b) => b.id === buildingId || b.id === LEGACY_BUILDINGS[buildingId]);
  const getSlot = (slotId) => campus?.deliverySlots.find((s) => s.id === slotId);
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

  // ---------- Auth ----------
  const login = async (email) => {
    const account = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) return false;
    setDataReady(false);
    applyUserData(await readJson(KEYS.data(account.email), newUserData(0)));
    await writeJson(KEYS.session, account.email);
    setUser(account);
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
    const data = newUserData(1000);
    await writeJson(KEYS.data(account.email), data);
    setDataReady(false);
    applyUserData(data);
    await writeJson(KEYS.session, account.email);
    setUser(account);
  };

  const logout = async () => {
    await writeJson(KEYS.session, null);
    setDataReady(false);
    setUser(null);
    setCart(EMPTY_CART);
    setOrders([]);
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

  const replaceCart = (item, storeId) => setCart({ storeId, items: [item] });

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

  const clearCart = () => setCart(EMPTY_CART);

  // ---------- Orders ----------
  const placeOrder = ({ buildingId, room, slotId, payment, saveLocation, locationLabel }) => {
    const totals = calcCartTotals(cart.items);
    if (payment === 'wallet' && wallet.balance < totals.total) return null;

    const couriers = campus.couriers;
    const order = {
      id: makeId('o'),
      number: String(Date.now()).slice(-5),
      storeId: cart.storeId,
      items: cart.items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      building: buildingId,
      room: room.trim().toUpperCase(),
      slotId,
      payment,
      courier: couriers[Math.floor(Math.random() * couriers.length)],
      createdAt: Date.now(),
      cancelled: false,
    };
    setOrders((prev) => [order, ...prev]);

    if (payment === 'wallet') {
      setWallet((prev) => ({
        balance: prev.balance - order.total,
        transactions: [
          makeTransaction('payment', order.total, `Order #${order.number} · ${getStore(order.storeId)?.name}`),
          ...prev.transactions,
        ],
      }));
    }
    if (saveLocation) addLocation({ label: locationLabel || 'Saved place', buildingId, room: order.room });
    clearCart();
    return order;
  };

  const cancelOrder = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || getOrderStatus(order, Date.now()) !== 'Received') return false;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, cancelled: true } : o)));
    if (order.payment === 'wallet') {
      setWallet((prev) => ({
        balance: prev.balance + order.total,
        transactions: [makeTransaction('refund', order.total, `Refund · Order #${order.number}`), ...prev.transactions],
      }));
    }
    return true;
  };

  const rateOrder = (orderId, stars, comment) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, rating: stars, comment: comment.trim() } : o)));
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

  // Returns { conflict, storeName } or { added, skipped: [names] }
  const reorder = (orderId, force = false) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { added: 0, skipped: [] };
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
    return { added: available.length, skipped };
  };

  // ---------- Wallet ----------
  const topUp = async (amount) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    setWallet((prev) => ({
      balance: prev.balance + amount,
      transactions: [makeTransaction('topup', amount, 'Wallet top-up'), ...prev.transactions],
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

  // ---------- Demo clock ----------
  const setDemoTime = (hhmm) => {
    const offset = offsetForTime(hhmm);
    setTimeOffsetMs(offset);
    writeJson(KEYS.demoOffset, offset);
  };

  const resetDemoTime = () => {
    setTimeOffsetMs(0);
    writeJson(KEYS.demoOffset, 0);
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
    cart,
    cartTotals: calcCartTotals(cart.items),
    wallet,
    orders,
    savedLocations,
    timeOffsetMs,
    refreshCampus,
    getStore,
    getProduct,
    getBuilding,
    getSlot,
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
