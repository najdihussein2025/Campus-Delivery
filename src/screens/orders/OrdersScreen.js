import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import Badge from '../../components/Badge';
import Chip from '../../components/Chip';
import { canReusePrintDocument, discardPrintDocument, pickPrintDocument, savePrintDocument } from '../../services/printDocuments';
import ConfirmModal from '../../components/ConfirmModal';
import DoorSign from '../../components/DoorSign';
import EmptyState from '../../components/EmptyState';
import SegmentedControl from '../../components/SegmentedControl';
import { StaggerItem, animateLayout, useToast } from '../../components/motion';
import { getCategoryColors, getCategoryIcon, MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { getOrderStatus } from '../../utils/orderStatus';
import { deliveryBreakLabel, isPastOrder, scheduledEta } from '../../utils/orderDetails';
import { bagItemDetails, getPrintOrderIssue, printOptionsFor } from '../../utils/cart';
import { fileKind, validateFile } from '../../utils/pdfPages';
import { formatDate } from '../../utils/time';
import * as haptics from '../../utils/haptics';
import Reanimated, { LinearTransition } from 'react-native-reanimated';
import { createStyles } from './OrdersScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const SHORT_NAMES = { cafeteria: 'Cafeteria', coffee: 'Coffee Corner', bookstore: 'Bookstore', printing: 'Printing' };
const STATUS_FILTERS = {
  active: ['All', 'Received', 'Preparing', 'On the way'],
  past: ['All', 'Delivered', 'Cancelled'],
};

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
  const [checkingDocuments, setCheckingDocuments] = useState(false);
  const reorderPending = useRef(false);
  const [missingDocuments, setMissingDocuments] = useState([]);
  const [replacementFiles, setReplacementFiles] = useState(new Map());
  const [documentError, setDocumentError] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const storeOptions = [{ id: 'all', label: 'All stores' }, ...campus.stores.map((s) => ({ id: s.id, label: SHORT_NAMES[s.id] || s.name }))];

  const sorted = [...orders].sort((a, b) => b.placedAtMs - a.placedAtMs);
  const activeCount = sorted.filter((o) => !isPastOrder(getOrderStatus(o, nowMs))).length;
  const filtered = sorted
    .filter((o) => (tab === 'past') === isPastOrder(getOrderStatus(o, nowMs)))
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
    setMissingDocuments([]);
    setReplacementFiles(new Map());
    setDocumentError('');
    setReorderPreview({ orderId, ...previewReorder(orderId) });
  };

  const selectReplacement = async (key) => {
    if (reorderPending.current) return;
    reorderPending.current = true;
    setDocumentError('');
    setCheckingDocuments(true);
    try {
      const file = await pickPrintDocument();
      if (!file) return;
      const issue = validateFile(file);
      if (issue) {
        setDocumentError(issue);
        return;
      }
      setReplacementFiles((previous) => new Map(previous).set(key, file));
    } catch {
      setDocumentError('Could not open that file. Try another one.');
    } finally {
      reorderPending.current = false;
      setCheckingDocuments(false);
    }
  };

  const confirmReorder = async () => {
    const preview = reorderPreview;
    if (!preview || reorderPending.current) return;
    const latest = previewReorder(preview.orderId);
    const changed = latest.items.length !== preview.items.length || latest.items.some((item, index) => {
      const shown = preview.items[index];
      return item.key !== shown?.key || item.unitPrice !== shown.unitPrice || item.qty !== shown.qty;
    });
    if (changed || (latest.conflict && (!preview.conflict || latest.storeName !== preview.storeName))) {
      setReorderPreview({ orderId: preview.orderId, ...latest });
      return;
    }
    const printJobs = latest.items.filter((item) => item.type === 'print');
    let outcome;
    if (printJobs.length) {
      const issue = getPrintOrderIssue(printJobs, campus.printPrices.maxPages);
      if (issue) {
        setDocumentError(issue);
        return;
      }
      reorderPending.current = true;
      setCheckingDocuments(true);
      setDocumentError('');
      const replacements = new Map();
      try {
        const available = await Promise.all(printJobs.map((item) => (
          replacementFiles.has(item.key) || canReusePrintDocument(item.file)
        )));
        const missing = printJobs.filter((_, index) => !available[index]);
        if (missing.length) {
          setMissingDocuments((previous) => [...new Set([...previous, ...missing.map((item) => item.key)])]);
          return;
        }
        for (const item of printJobs) {
          const file = replacementFiles.get(item.key);
          if (!file) continue;
          const key = 'print-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          const reference = await savePrintDocument(file, key);
          replacements.set(item.key, {
            key,
            name: file.name,
            file: {
              ...reference,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.mimeType,
              kind: fileKind(file),
              pages: printOptionsFor(item).pages,
            },
          });
        }
        const current = previewReorder(preview.orderId);
        if (current.conflict && (!preview.conflict || current.storeName !== preview.storeName)) {
          setReorderPreview({ orderId: preview.orderId, ...current });
          return;
        }
        outcome = reorder(preview.orderId, preview.conflict, replacements);
        if (outcome.printIssue) {
          setDocumentError(outcome.printIssue);
          return;
        }
      } catch {
        setDocumentError('Could not save the selected documents. Select them again and try again.');
        return;
      } finally {
        if (!outcome?.added) {
          await Promise.all([...replacements.values()].map(({ file }) => discardPrintDocument(file).catch(() => {})));
        }
        reorderPending.current = false;
        setCheckingDocuments(false);
      }
    } else {
      outcome = reorder(preview.orderId, preview.conflict);
    }
    setReorderPreview(null);
    if (outcome.closed) {
      haptics.error();
      showToast({ message: `${outcome.reason} · ordering opens ${outcome.opensText}`, icon: 'moon', tone: 'error' });
    } else if (outcome.printIssue) {
      showToast({ message: outcome.printIssue, icon: 'alert-circle', tone: 'error' });
    } else if (outcome.conflict) {
      setReorderPreview({ orderId: preview.orderId, ...previewReorder(preview.orderId) });
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
    const past = isPastOrder(status);
    const breakLabel = deliveryBreakLabel(getOrderSlot(item));
    const count = item.items.reduce((sum, i) => sum + i.qty, 0);
    return (
      <StaggerItem index={index}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <LinearGradient colors={getCategoryColors(store?.category)} style={styles.storeTile}>
              <Ionicons name={getCategoryIcon(store?.category)} size={20} color={colors.textOnDark} />
            </LinearGradient>
            <View style={styles.cardInfo}>
              <Text style={styles.storeName} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store ? store.name : 'Store'}</Text>
              <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>#{item.number} · {formatDate(item.placedAt)}</Text>
              {breakLabel ? (
                <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>{breakLabel}{scheduledEta(item) ? ', ETA ' + scheduledEta(item) : ''}</Text>
              ) : null}
              <Badge status={status} style={styles.status} />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardMiddle}>
            <DoorSign code={item.room} size="sm" />
            <Text style={styles.itemsText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {count} {count === 1 ? 'item' : 'items'} · <Text style={styles.total}>{formatMoney(item.total)}</Text>
            </Text>
          </View>
          {item.rewardUsed ? (
            <Text style={styles.rewardLine} maxFontSizeMultiplier={MAX_FONT_SCALE}>Free coffee applied</Text>
          ) : null}
          <View style={styles.actions}>
            {past ? (
              <>
                <AppButton title="View details" variant="secondary" small style={styles.action}
                  onPress={() => navigation.navigate('Tracking', { orderId: item.id })} />
                <AppButton title="Reorder" small style={styles.action} onPress={() => openReorder(item.id)} />
              </>
            ) : (
              <AppButton
                title="Track order"
                icon="navigate-outline"
                small
                style={styles.action}
                onPress={() => navigation.navigate('Tracking', { orderId: item.id })}
              />
            )}
          </View>
        </View>
      </StaggerItem>
    );
  };

  const filterRow = [
    ...storeOptions.map((o) => ({ key: `store-${o.id}`, kind: 'store', id: o.id, label: o.label })),
    ...(tab === 'past'
      ? [{ key: 'divider', kind: 'divider' }, ...STATUS_FILTERS.past.map((label) => ({ key: `status-${label}`, kind: 'status', label }))]
      : []),
  ];

  const header = (
    <View style={styles.filters}>
      <SegmentedControl
        compact
        options={[
          { value: 'active', label: `Active (${activeCount})` },
          { value: 'past', label: 'Past' },
        ]}
        value={tab}
        onChange={switchTab}
        style={styles.segment}
      />
      {/* One horizontal row: store filters, and on Past a divider + the status filters (Active cards show their status) */}
      <FlatList
        horizontal
        data={filterRow}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        extraData={[storeFilter, statusFilter, tab]}
        renderItem={({ item }) => {
          if (item.kind === 'divider') return <View style={styles.filterDivider} />;
          if (item.kind === 'store') {
            return <Chip compact label={item.label} selected={storeFilter === item.id} onPress={() => pickFilter(setStoreFilter, item.id)} />;
          }
          return <Chip compact label={item.label} selected={statusFilter === item.label} onPress={() => pickFilter(setStatusFilter, item.label)} />;
        }}
      />
    </View>
  );

  const filtersActive = storeFilter !== 'all' || statusFilter !== 'All';

  return (
    <View style={styles.screen}>
      <Reanimated.FlatList
        itemLayoutAnimation={LinearTransition.springify().damping(20)}
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
              subtitle="New orders appear here until they are delivered or cancelled."
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
        loading={checkingDocuments}
        title={!reorderPreview?.items.length ? 'Items unavailable'
          : missingDocuments.length ? 'Review print reorder'
            : reorderPreview.conflict ? 'Replace your bag?' : 'Reorder these items?'}
        message={
          reorderPreview?.conflict && reorderPreview.items.length
            ? `Your bag has items from ${reorderPreview.storeName}. It will be emptied first.`
            : reorderPreview?.items.length ? 'Add these items at current prices, then review your bag.' : 'These items are currently unavailable.'
        }
        icon="refresh"
        tone={reorderPreview && reorderPreview.conflict ? 'warning' : 'primary'}
        confirmLabel={reorderPreview?.items.length ? 'Add to bag' : 'OK'}
        onConfirm={reorderPreview?.items.length ? confirmReorder : () => setReorderPreview(null)}
        onCancel={() => { if (!reorderPending.current) setReorderPreview(null); }}
      >
        {reorderPreview ? (
          <View style={styles.previewBox}>
            {missingDocuments.length ? (
              <Text style={styles.meta}>Some saved documents are unavailable. Select them again below. Your original printing settings will be kept.</Text>
            ) : null}
            {documentError ? <Text style={styles.skippedText} accessibilityLiveRegion="polite">{documentError}</Text> : null}
            <FlatList
              data={reorderPreview.items}
              keyExtractor={(item) => item.key}
              extraData={replacementFiles}
              style={styles.previewItems}
              renderItem={({ item }) => (
                <View style={styles.previewRow}>
                  <Text style={styles.previewQty}>{item.qty}×</Text>
                  <View style={styles.previewName}>
                    <Text style={styles.previewLabel}>{replacementFiles.get(item.key)?.name || item.name}</Text>
                    {bagItemDetails(item) ? <Text style={styles.meta}>{bagItemDetails(item)}</Text> : null}
                    {missingDocuments.includes(item.key) ? (
                      <AppButton
                        small
                        variant="secondary"
                        disabled={checkingDocuments}
                        title={replacementFiles.has(item.key) ? 'Change document' : 'Select document again'}
                        onPress={() => selectReplacement(item.key)}
                      />
                    ) : null}
                  </View>
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
            {reorderPreview.adjusted.length ? (
              <Text style={styles.meta}>Options updated for {reorderPreview.adjusted.join(', ')}.</Text>
            ) : null}
          </View>
        ) : null}
      </ConfirmModal>
    </View>
  );
}
