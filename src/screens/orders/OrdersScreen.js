import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import Badge from '../../components/Badge';
import Chip from '../../components/Chip';
import ConfirmModal from '../../components/ConfirmModal';
import DoorSign from '../../components/DoorSign';
import EmptyState from '../../components/EmptyState';
import SegmentedControl from '../../components/SegmentedControl';
import { PressableScale, StaggerItem, animateLayout, useToast } from '../../components/motion';
import { getCategoryColors, getCategoryIcon, MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { getOrderStatus } from '../../utils/orderStatus';
import { formatDate } from '../../utils/time';
import * as haptics from '../../utils/haptics';
import { createStyles } from './OrdersScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const SHORT_NAMES = { cafeteria: 'Cafeteria', coffee: 'Coffee', bookstore: 'Bookstore', printing: 'Printing' };
const STATUS_FILTERS = {
  active: ['All', 'Received', 'Preparing', 'On the way'],
  past: ['All', 'Delivered', 'Cancelled'],
};
const isPastStatus = (status) => status === 'Delivered' || status === 'Cancelled';

// Orders history: Active/Past segmented control + filter chips (horizontal FlatLists) + live status interval with cleanup
export default function OrdersScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { orders, campus, getStore, getOrderSlot, reorder, previewReorder } = useApp();
  const { showToast } = useToast();
  const [tab, setTab] = useState('active');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [nowMs, setNowMs] = useState(Date.now());
  const [reorderPreview, setReorderPreview] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (orders.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="receipt-outline"
          title="No orders yet"
          subtitle="Your orders and their live status will appear here."
          actionLabel="Start ordering"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const storeOptions = [{ id: 'all', label: 'All stores' }, ...campus.stores.map((s) => ({ id: s.id, label: SHORT_NAMES[s.id] || s.name }))];

  const sorted = [...orders].sort((a, b) => b.placedAtMs - a.placedAtMs);
  const activeCount = sorted.filter((o) => !isPastStatus(getOrderStatus(o, nowMs))).length;
  const filtered = sorted
    .filter((o) => (tab === 'past') === isPastStatus(getOrderStatus(o, nowMs)))
    .filter((o) => storeFilter === 'all' || o.storeId === storeFilter)
    .filter((o) => statusFilter === 'All' || getOrderStatus(o, nowMs) === statusFilter);

  const switchTab = (value) => {
    animateLayout();
    setTab(value);
    setStatusFilter('All');
  };

  const pickFilter = (setter, value) => {
    animateLayout();
    setter(value);
  };

  const openReorder = (orderId) => {
    haptics.tap();
    setReorderPreview({ orderId, ...previewReorder(orderId) });
  };

  const confirmReorder = () => {
    const preview = reorderPreview;
    setReorderPreview(null);
    const outcome = reorder(preview.orderId, preview.conflict);
    if (outcome.closed) {
      haptics.error();
      showToast({ message: `${outcome.reason} · ordering opens ${outcome.opensText}`, icon: 'moon', tone: 'error' });
    } else if (outcome.added > 0) {
      haptics.success();
      showToast({
        message: `${outcome.added} ${outcome.added === 1 ? 'item' : 'items'} added to your bag`,
        icon: 'bag-check',
        tone: 'success',
      });
      navigation.navigate('Cart');
    } else {
      haptics.error();
      showToast({ message: 'Nothing to reorder – all items are out of stock', icon: 'alert-circle', tone: 'error' });
    }
  };

  const renderOrder = ({ item, index }) => {
    const store = getStore(item.storeId);
    const status = getOrderStatus(item, nowMs);
    const past = isPastStatus(status);
    const count = item.items.reduce((sum, i) => sum + i.qty, 0);
    return (
      <StaggerItem index={index}>
        <PressableScale
          onPress={() => navigation.navigate('Tracking', { orderId: item.id })}
          style={styles.card}
          accessibilityLabel={`Order ${item.number} from ${store ? store.name : 'store'}, ${status}`}
        >
          <View style={styles.cardTop}>
            <LinearGradient colors={getCategoryColors(store?.category)} style={styles.storeTile}>
              <Ionicons name={getCategoryIcon(store?.category)} size={20} color={colors.textOnDark} />
            </LinearGradient>
            <View style={styles.cardInfo}>
              <Text style={styles.storeName} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store ? store.name : 'Store'}</Text>
              <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>#{item.number} · {formatDate(item.placedAt)}</Text>
              {getOrderSlot(item) ? (
                <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>{getOrderSlot(item).label} break</Text>
              ) : null}
            </View>
            <Badge status={status} />
          </View>
          <View style={styles.divider} />
          <View style={styles.cardMiddle}>
            <DoorSign code={item.room} size="sm" />
            <Text style={styles.itemsText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {count} {count === 1 ? 'item' : 'items'} · <Text style={styles.total}>{formatMoney(item.total)}</Text>
            </Text>
          </View>
          {item.rewardUsed ? (
            <Text style={styles.rewardLine} maxFontSizeMultiplier={MAX_FONT_SCALE}>🎁 Free coffee applied</Text>
          ) : null}
          <View style={styles.actions}>
            {past ? (
              <AppButton title="Reorder" icon="refresh" small style={styles.action} onPress={() => openReorder(item.id)} />
            ) : (
              <AppButton
                title="Track"
                icon="navigate-outline"
                small
                style={styles.action}
                onPress={() => navigation.navigate('Tracking', { orderId: item.id })}
              />
            )}
          </View>
        </PressableScale>
      </StaggerItem>
    );
  };

  const header = (
    <View style={styles.filters}>
      <SegmentedControl
        options={[
          { value: 'active', label: `Active${activeCount ? ` (${activeCount})` : ''}` },
          { value: 'past', label: 'Past' },
        ]}
        value={tab}
        onChange={switchTab}
        style={styles.segment}
      />
      <FlatList
        horizontal
        data={storeOptions}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        extraData={storeFilter}
        renderItem={({ item }) => (
          <Chip label={item.label} selected={storeFilter === item.id} onPress={() => pickFilter(setStoreFilter, item.id)} />
        )}
      />
      <FlatList
        horizontal
        data={STATUS_FILTERS[tab]}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        extraData={statusFilter}
        renderItem={({ item }) => (
          <Chip label={item} selected={statusFilter === item} onPress={() => pickFilter(setStatusFilter, item)} />
        )}
      />
    </View>
  );

  const filtersActive = storeFilter !== 'all' || statusFilter !== 'All';

  return (
    <View style={styles.screen}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListHeaderComponent={header}
        ListEmptyComponent={
          filtersActive ? (
            <EmptyState
              icon="funnel-outline"
              title="No orders match these filters"
              subtitle="Try another store or status."
              actionLabel="Clear filters"
              onAction={() => {
                animateLayout();
                setStoreFilter('all');
                setStatusFilter('All');
              }}
            />
          ) : tab === 'active' ? (
            <EmptyState
              icon="bicycle-outline"
              title="No active orders"
              subtitle="Orders on their way to you will show up here."
              actionLabel="Order something"
              onAction={() => navigation.navigate('Home')}
            />
          ) : (
            <EmptyState icon="time-outline" title="No past orders yet" subtitle="Delivered and cancelled orders will appear here." />
          )
        }
        contentContainerStyle={styles.list}
        extraData={nowMs}
        showsVerticalScrollIndicator={false}
      />

      <ConfirmModal
        visible={Boolean(reorderPreview)}
        title={reorderPreview && reorderPreview.conflict ? 'Replace your bag?' : 'Reorder these items?'}
        message={
          reorderPreview && reorderPreview.conflict
            ? `Your bag has items from ${reorderPreview.storeName}. It will be emptied first.`
            : 'They will be added to your bag.'
        }
        icon="refresh"
        tone={reorderPreview && reorderPreview.conflict ? 'warning' : 'primary'}
        confirmLabel={reorderPreview && reorderPreview.items.length ? 'Add to bag' : 'OK'}
        onConfirm={reorderPreview && reorderPreview.items.length ? confirmReorder : () => setReorderPreview(null)}
        onCancel={() => setReorderPreview(null)}
      >
        {reorderPreview ? (
          <View style={styles.previewBox}>
            <FlatList
              data={reorderPreview.items}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.previewRow}>
                  <Text style={styles.previewQty}>{item.qty}×</Text>
                  <Text style={styles.previewName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.previewPrice}>{formatMoney(item.unitPrice * item.qty)}</Text>
                </View>
              )}
            />
            {reorderPreview.skipped.length ? (
              <View style={styles.skippedBox}>
                <Ionicons name="alert-circle" size={16} color={colors.warningText} />
                <Text style={styles.skippedText}>Out of stock, skipped: {reorderPreview.skipped.join(', ')}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ConfirmModal>
    </View>
  );
}
