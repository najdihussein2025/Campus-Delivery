import React, { useEffect, useState } from 'react';
import { Animated, FlatList, RefreshControl, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppInput from '../../components/AppInput';
import Chip from '../../components/Chip';
import ConfirmModal from '../../components/ConfirmModal';
import DietFilterChips from '../../components/DietFilterChips';
import SeasonBanner from '../../components/SeasonBanner';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import SectionHeader from '../../components/SectionHeader';
import SkeletonStoreCard from '../../components/SkeletonStoreCard';
import StoreCard from '../../components/StoreCard';
import WalletBanner from '../../components/WalletBanner';
import { BumpBadge, PressableScale, PulseDot, StaggerItem, animateLayout, useScreenFocusAnimation, useToast } from '../../components/motion';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { getOrderStatus } from '../../utils/orderStatus';
import { matchesDiet } from '../../utils/diet';
import { formatTime, getGreeting, getNextAvailableSlot, getNow, getOrderingBlock, isStoreOpen, nextOrderingText, storeStatusLabel } from '../../utils/time';
import { createStyles } from './HomeScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import useDietFilter from '../../hooks/useDietFilter';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';

const CATEGORIES = [
  { key: 'All', icon: 'apps' },
  { key: 'Food', icon: 'fast-food' },
  { key: 'Drinks', icon: 'cafe' },
  { key: 'Stationery', icon: 'book' },
  { key: 'Printing', icon: 'print' },
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SKELETONS = [{ type: 'skeleton', id: 'sk1' }, { type: 'skeleton', id: 'sk2' }, { type: 'skeleton', id: 'sk3' }];

// Home: FlatList with ListHeaderComponent, RefreshControl, skeletons and a re-render timer (useEffect cleanup)
export default function HomeScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const {
    campus, user, wallet, orders, cart, cartTotals, timeOffsetMs, refreshCampus,
    getStore, getStoreLocation, getCampus, reorder, loyalty, visibleSeasons, dismissSeason,
  } = useApp();
  const diet = useDietFilter();
  const { isOnline } = useNetwork();
  const { showToast } = useToast();
  const { animatedStyle } = useScreenFocusAnimation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [, setTick] = useState(0);

  // Re-render every 10 s so the clock, open badges and the active order banner stay live
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    if (!isOnline) {
      showToast({ message: "Can't refresh while offline", icon: 'cloud-offline', tone: 'error' });
      return;
    }
    setRefreshing(true);
    await refreshCampus();
    setRefreshing(false);
  };

  const selectCategory = (key) => {
    animateLayout();
    setCategory(key);
  };

  const nowMs = Date.now();
  const now = getNow(timeOffsetMs);
  const firstName = user?.name.split(' ')[0] || 'there';
  const campusInfo = getCampus();
  const query = search.trim().toLowerCase();
  const inCategory = (storeId) => category === 'All' || getStore(storeId)?.category === category;

  const stores = campus.stores.filter((store) => {
    if (!inCategory(store.id)) return false;
    if (!query) return true;
    return store.name.toLowerCase().includes(query);
  });
  // Products show up when searching or when a dietary filter is on
  const showProducts = Boolean(query) || diet.selected.length > 0;
  const productResults = showProducts
    ? campus.products.filter(
        (p) => inCategory(p.storeId) && (!query || p.name.toLowerCase().includes(query)) && matchesDiet(p, diet.selected)
      )
    : [];

  const listData = refreshing
    ? SKELETONS
    : [
        ...stores.map((store) => ({ type: 'store', id: store.id, store })),
        ...productResults.map((product) => ({ type: 'product', id: product.id, product })),
      ];

  // Banner: the first break that is still possible. Uses the cart's store if the bag is not empty,
  // otherwise every store that is open right now (the one with the shortest prep time decides).
  const cartStore = cart.items.length ? getStore(cart.storeId) : null;
  const bannerStores = cartStore ? [cartStore] : campus.stores.filter((s) => isStoreOpen(s, timeOffsetMs));
  const available = getNextAvailableSlot(campus.deliverySlots, bannerStores, timeOffsetMs);
  const nextSlot = available ? available.slot : null;
  const minutesLeft = available ? available.minutesLeft : 0;
  const missedNote = available?.skipped ? `${available.skipped.label.split('–')[0]} break is too close to order` : '';
  const closedBlock = getOrderingBlock(timeOffsetMs, campus.deliverySlots);

  const activeOrder = orders.find((o) => !o.cancelled && getOrderStatus(o, nowMs) !== 'Delivered');
  const lastDelivered = orders.find((o) => !o.cancelled && getOrderStatus(o, nowMs) === 'Delivered');

  const openStore = (store) => {
    if (store.id === 'printing') navigation.navigate('Print');
    else navigation.navigate('StoreMenu', { storeId: store.id });
  };

  // One-tap reorder from the "Order again" card (one-store rule handled with a confirm sheet)
  const doReorder = (orderId, force) => {
    const result = reorder(orderId, force);
    if (result.conflict) {
      setConflict({ orderId, storeName: result.storeName });
      return;
    }
    setConflict(null);
    if (result.closed) {
      showToast({ message: `${result.reason} · ordering opens ${result.opensText}`, icon: 'moon', tone: 'error' });
      return;
    }
    if (!result.added) {
      showToast({ message: 'These items are out of stock right now', icon: 'alert-circle', tone: 'error' });
      return;
    }
    const skippedText = result.skipped.length ? ` · skipped ${result.skipped.join(', ')}` : '';
    showToast({ message: `Added to bag${skippedText}`, icon: 'bag-check', tone: 'success' });
    navigation.navigate('Cart');
  };

  const header = (
    <View>
      <View style={styles.topRow}>
        <View style={styles.greetingBox}>
          <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {DAYS[now.getDay()]} · {formatTime(now)}
          </Text>
          <Text style={styles.greeting} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {getGreeting(timeOffsetMs)}, <Text style={styles.name}>{firstName}</Text>
          </Text>
          <View style={styles.campusRow}>
            <Ionicons name="location" size={14} color={colors.primaryText} />
            <Text style={styles.campusText} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {campusInfo ? `${campusInfo.name} · ${campusInfo.subtitle}` : 'Université Antonine'}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={() => navigation.navigate('Cart')}
          style={styles.bagButton}
          accessibilityLabel={`Your bag, ${cartTotals.count} items`}
        >
          <Ionicons name="bag-handle-outline" size={24} color={colors.primaryText} />
          <BumpBadge value={cartTotals.count} style={styles.bagBadge} />
        </PressableScale>
      </View>

      <WalletBanner
        nextSlot={nextSlot}
        minutesLeft={minutesLeft}
        missedNote={missedNote}
        balance={wallet.balance}
        onTopUp={() => navigation.navigate('Wallet')}
        emptyText={`No more breaks today – ordering opens ${nextOrderingText(campus.deliverySlots, timeOffsetMs)}`}
        closedInfo={closedBlock}
      />

      {/* Loyalty strip: opens the stamp card */}
      <PressableScale
        onPress={() => navigation.navigate('Loyalty')}
        style={styles.loyaltyStrip}
        accessibilityLabel={loyalty.rewards > 0 ? 'Coffee stamps, you have a free coffee' : `Coffee stamps, ${loyalty.stamps} of 10`}
      >
        <Text style={styles.loyaltyText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {loyalty.rewards > 0 ? '🎁 Free coffee ready' : `☕ ${loyalty.stamps}/10 · ${10 - loyalty.stamps} to go`}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </PressableScale>

      <SeasonBanner seasons={visibleSeasons} onSelectTag={diet.turnOn} onDismiss={dismissSeason} />

      {activeOrder ? (
        <PressableScale
          onPress={() => navigation.navigate('Tracking', { orderId: activeOrder.id })}
          style={styles.activeBanner}
          accessibilityLabel="Track your active order"
        >
          <PulseDot color={colors.accent} size={10} />
          <View style={styles.activeText}>
            <Text style={styles.activeTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Order #{activeOrder.number} · {getOrderStatus(activeOrder, nowMs)}
            </Text>
            <Text style={styles.activeSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {getStore(activeOrder.storeId)?.name} · tap to track
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textOnDark} />
        </PressableScale>
      ) : null}

      {lastDelivered && !query ? (
        <View>
          <SectionHeader title="Order again" />
          <PressableScale onPress={() => doReorder(lastDelivered.id, false)} style={styles.againCard} haptic accessibilityLabel="Reorder your last order">
            <ProductImage category={getStore(lastDelivered.storeId)?.category} productId={lastDelivered.items.find((i) => i.productId)?.productId} storeId={lastDelivered.storeId} size={52} rounded={14} iconSize={24} style={styles.againImage} />
            <View style={styles.againText}>
              <Text style={styles.againTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {lastDelivered.items.map((i) => i.name).join(', ')}
              </Text>
              <Text style={styles.againSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {getStore(lastDelivered.storeId)?.name} · {formatMoney(lastDelivered.subtotal)}
              </Text>
            </View>
            <View style={styles.againPill}>
              <Ionicons name="refresh" size={14} color={colors.textOnDark} />
              <Text style={styles.againPillText}>Reorder</Text>
            </View>
          </PressableScale>
        </View>
      ) : null}

      <AppInput
        icon="search"
        placeholder="Search stores or products"
        value={search}
        onChangeText={setSearch}
        clearable
        onClear={() => setSearch('')}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.search}
      />

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <Chip label={item.key} icon={item.icon} selected={category === item.key} onPress={() => selectCategory(item.key)} />
        )}
      />
      <DietFilterChips selected={diet.selected} onToggle={diet.toggle} />

      <SectionHeader
        title={showProducts ? `Results · ${stores.length + productResults.length}` : `Stores · ${stores.length}`}
        style={styles.sectionHeader}
      />
    </View>
  );

  const renderItem = ({ item, index }) => {
    if (item.type === 'skeleton') return <SkeletonStoreCard />;
    if (item.type === 'store') {
      return (
        <StoreCard
          store={item.store}
          index={index}
          isOpen={isStoreOpen(item.store, timeOffsetMs)}
          statusLabel={storeStatusLabel(item.store, timeOffsetMs)}
          location={getStoreLocation(item.store)}
          onPress={() => openStore(item.store)}
        />
      );
    }
    const product = item.product;
    const store = getStore(product.storeId);
    return (
      <StaggerItem index={index}>
        <PressableScale
          onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
          style={[styles.productRow, !product.inStock && styles.productRowDimmed]}
          accessibilityLabel={`${product.name} from ${store?.name}`}
        >
          <ProductImage category={product.category} productId={product.id} size={44} rounded={12} iconSize={22} style={styles.productTile} dimmed={!product.inStock} />
          <View style={styles.productText}>
            <Text style={styles.productName} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {product.name} <Text style={styles.productStore}>– {store?.name}</Text>
            </Text>
            <Text style={styles.productMeta} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {product.inStock ? product.category : 'Out of stock'}
            </Text>
          </View>
          <Text style={styles.productPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {formatMoney(product.price)}
          </Text>
        </PressableScale>
      </StaggerItem>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Animated.View style={[styles.flex, animatedStyle]}>
        <FlatList
          data={listData}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="Nothing found"
              subtitle={
                diet.selected.length > 0
                  ? 'No store or product matches your search and filters.'
                  : `No store or product matches "${search}".`
              }
              actionLabel={diet.selected.length > 0 ? 'Clear filters' : 'Clear search'}
              onAction={() => {
                setSearch('');
                setCategory('All');
                diet.clear();
              }}
            />
          }
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryText} colors={[colors.primary]} />
          }
        />
      </Animated.View>

      <ConfirmModal
        visible={!!conflict}
        tone="warning"
        icon="swap-horizontal"
        title="Start a new bag?"
        message={`Your bag has items from ${conflict?.storeName || 'another store'}. Empty it and reorder?`}
        confirmLabel="Empty & reorder"
        onConfirm={() => doReorder(conflict.orderId, true)}
        onCancel={() => setConflict(null)}
      />
    </SafeAreaView>
  );
}
