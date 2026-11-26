import React, { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import ConfirmModal from '../../components/ConfirmModal';
import PriceSummary from '../../components/PriceSummary';
import ProductImage from '../../components/ProductImage';
import NotificationPrompt from '../../components/NotificationPrompt';
import DoorSign from '../../components/DoorSign';
import EmptyState from '../../components/EmptyState';
import StarRating from '../../components/StarRating';
import StatusTimeline from '../../components/StatusTimeline';
import { AnimatedProgressBar, FadeInView, useToast } from '../../components/motion';
import { gradients, MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { getCampusStatusTime, getOrderStatus, getStepProgress, STATUS_STEPS } from '../../utils/orderStatus';
import { formatDate, formatFloorLong, formatTime } from '../../utils/time';
import { bagItemDetails } from '../../utils/cart';
import { deliveryBreakLabel, deliveryDateLabel, isPastOrder, orderTotals } from '../../utils/orderDetails';
import { stampsForOrder } from '../../utils/loyalty';
import { dismissOrderNotifications, setViewing } from '../../services/notifications';
import * as haptics from '../../utils/haptics';
import { createStyles } from './TrackingScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const QUICK_TAGS = ['Fast', 'Hot', 'Friendly courier', 'Accurate'];

const initials = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const STATUS_TITLES = {
  Received: 'Order received',
  Preparing: 'Preparing your order',
  'On the way': 'On the way to your room',
  Delivered: 'Order delivered',
  Cancelled: 'Order cancelled',
};
const PREPARATION_ICONS = { cafeteria: 'restaurant', coffee: 'cafe', bookstore: 'book', printing: 'print' };

const timestamp = (value) => Number.isFinite(value) && value > 0 ? formatDate(value) : '';

export default function TrackingScreen({ route, navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const { orders, getStore, getOrderSlot, getBuilding, cancelOrder, rateOrder, settle, lastSettlement } = useApp();
  const { showToast } = useToast();
  const [nowMs, setNowMs] = useState(Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [earnedReward, setEarnedReward] = useState(false);
  const feedbackShown = useRef(false);
  const order = orders.find((entry) => entry.id === orderId);
  const status = order ? getOrderStatus(order, nowMs) : null;
  const delivered = status === 'Delivered';
  const active = Boolean(status && !isPastOrder(status));

  // Chapter 19: the brief's required timer — setInterval every second, cleared in the cleanup.
  // The status itself comes from timestamps, so the timer only refreshes `now` (and settles loyalty stamps).
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setNowMs(Date.now());
      settle();
    }, 1000);
    return () => clearInterval(id);
  }, [active, settle]);

  // Back from the background: recompute right away (the order may have moved on while the app was closed)
  useEffect(() => {
    if (!active) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNowMs(Date.now());
        settle();
      }
    });
    return () => sub.remove();
  }, [active, settle]);

  // Tell the notification handler which order is on screen (no banner for it) and clear its tray entries
  useEffect(() => {
    if (!active) return;
    setViewing('Tracking', orderId);
    dismissOrderNotifications(orderId);
    return () => setViewing(null);
  }, [active, orderId]);

  // Stamp feedback: "+2 stamps ☕", and a celebration when this order completed the card
  useEffect(() => {
    // Only react to a fresh settlement (not an old one when the screen is reopened later)
    if (!lastSettlement || feedbackShown.current || Date.now() - lastSettlement.at > 60000) return;
    const mine = lastSettlement.items.find((i) => i.orderId === orderId);
    if (!mine) return;
    feedbackShown.current = true;
    showToast({ message: `+${mine.stamps} ${mine.stamps === 1 ? 'stamp' : 'stamps'}`, icon: 'cafe', tone: 'success' });
    if (mine.completed) {
      setEarnedReward(true);
      haptics.success();
    }
  }, [lastSettlement]);

  // Success haptic only when the order turns "Delivered" while this screen is open
  const wasDelivered = useRef(delivered);
  useEffect(() => {
    if (delivered && !wasDelivered.current) {
      haptics.success();
    }
    wasDelivered.current = delivered;
  }, [delivered]);

  if (!order) {
    return (
      <View style={styles.screen}>
        <EmptyState icon="search-outline" title="Order not found" actionLabel="Go back" onAction={() => navigation.goBack()} />
      </View>
    );
  }

  const store = getStore(order.storeId);
  const storeName = store ? store.name : 'The store';
  const slot = getOrderSlot(order);
  const progress = getStepProgress(order, nowMs);
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
  const building = getBuilding(order.building);
  const breakLabel = deliveryBreakLabel(slot);
  const scheduledDate = deliveryDateLabel(order);
  const stampCount = stampsForOrder(order);
  const roomParts = String(order.room ?? '').split('.');
  const floorLabel = roomParts.length === 3 && /^-?\d+$/.test(roomParts[1])
    ? formatFloorLong(Number(roomParts[1])) : '';
  const paymentLabel = order.payment === 'wallet' ? 'Campus wallet' : 'Cash on delivery';
  const paymentStatus = order.payment === 'wallet'
    ? order.cancelled ? 'Refunded to wallet' : 'Paid'
    : order.cancelled ? 'Cancelled' : !delivered ? 'Payment due on delivery' : '';
  const recordedTimes = [
    timestamp(order.placedAt ?? order.placedAtMs),
    ...['preparing', 'onTheWay', 'delivered'].map((step, index) => {
      const recorded = order[step + 'At'];
      if (recorded) return timestamp(recorded);
      const realTime = order.statusSchedule?.[step];
      return !order.cancelled && progress.index > index && realTime
        ? timestamp(getCampusStatusTime(order, realTime)) : '';
    }),
  ];

  const toggleTag = (tag) => {
    haptics.tap();
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const submitRating = () => {
    if (stars < 1) {
      haptics.error();
      setRatingError('Please choose 1 to 5 stars');
      return;
    }
    const text = [tags.join(' · '), comment.trim()].filter(Boolean).join(' — ');
    if (!rateOrder(order.id, stars, text)) {
      setRatingError('Only delivered orders can be rated once.');
      return;
    }
    haptics.success();
    showToast({ message: 'Thanks for your feedback', icon: 'star', tone: 'success' });
  };

  const handleCancel = () => {
    const ok = cancelOrder(order.id);
    setConfirmCancel(false);
    if (!ok) {
      showToast({ message: 'This order can no longer be cancelled.', icon: 'alert-circle', tone: 'error' });
      return;
    }
    haptics.warning();
    showToast({
      message: order.payment === 'wallet' ? `Refunded ${formatMoney(order.total)} to your wallet` : 'Order cancelled',
      icon: order.payment === 'wallet' ? 'wallet' : 'close-circle',
      tone: 'success',
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={order.cancelled ? [colors.textBrand, colors.primaryDark] : gradients.brand} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroMicro} maxFontSizeMultiplier={MAX_FONT_SCALE}>Order #{order.number}</Text>
            <Badge status={status} />
          </View>
          <Text style={styles.heroTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{STATUS_TITLES[status]}</Text>
          <Text style={styles.heroSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {storeName} {'\u00b7'} {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
          {active ? (
            <View style={styles.routeBox}>
              <AnimatedProgressBar
                progress={(progress.index + 1) / STATUS_STEPS.length}
                color={colors.accent}
                trackColor="rgba(255,255,255,0.22)"
                height={6}
              />
              <Text style={styles.routeLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Stage {progress.index + 1} of {STATUS_STEPS.length}
              </Text>
            </View>
          ) : null}
          {delivered && earnedReward ? (
            <Text style={styles.heroSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>You earned a free coffee.</Text>
          ) : delivered && stampCount > 0 && order.stampsCredited ? (
            <Text style={styles.heroSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {stampCount} coffee {stampCount === 1 ? 'stamp' : 'stamps'} earned
            </Text>
          ) : null}
        </LinearGradient>

        <Card style={styles.section}>
          <Text style={styles.micro} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Scheduled delivery</Text>
          <Text style={styles.etaTime} maxFontSizeMultiplier={MAX_FONT_SCALE}>{breakLabel || 'Delivery break unavailable'}</Text>
          {scheduledDate ? <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>{scheduledDate}</Text> : null}
          {active && order.statusSchedule?.delivered ? (
            <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Simulated ETA: {formatTime(new Date(getCampusStatusTime(order, order.statusSchedule.delivered)))}
            </Text>
          ) : null}
          <View style={styles.divider} />
          <Text style={styles.micro} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Delivery location</Text>
          {building || floorLabel ? (
            <Text style={styles.locationText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {[building?.name, floorLabel].filter(Boolean).join(' \u00b7 ')}
            </Text>
          ) : null}
          {order.room ? <View style={styles.roomPlate}><DoorSign code={order.room} size="md" /></View> : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Order progress</Text>
          <StatusTimeline currentIndex={progress.index} recordedTimes={recordedTimes}
            preparationIcon={PREPARATION_ICONS[order.storeId]}
            deliveryLocation={[building?.name, order.room && 'Room ' + order.room].filter(Boolean).join(', ')}
            cancelled={order.cancelled} cancelledTime={timestamp(order.cancelledAt)} />
        </Card>

        {active && order.courier ? (
          <Card style={[styles.section, styles.row]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(order.courier)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>Assigned courier</Text>
              <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{order.courier}</Text>
              <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {status === 'On the way' ? 'Bringing your order to the scheduled room.' : 'Assigned to your campus delivery.'}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Order details</Text>
          <FlatList data={order.items} scrollEnabled={false} keyExtractor={(item) => item.key} renderItem={({ item }) => {
            const details = bagItemDetails(item);
            const rewarded = item.key === order.rewardItemKey && Boolean(order.rewardItemKey);
            return (
              <View key={item.key} style={styles.orderItem}>
                <View style={styles.itemImage}>
                  <ProductImage category={item.category || store?.category} productId={item.productId} size={46} rounded={10} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemName} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.qty} {'\u00d7'} {item.name}</Text>
                  {details ? <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>{details}</Text> : null}
                  {rewarded ? <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>Coffee reward applied to one cup</Text> : null}
                  <Text style={styles.itemPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(item.unitPrice * item.qty - (rewarded ? order.discount : 0))}</Text>
                </View>
              </View>
            );
          }} />
        </Card>

        <PriceSummary totals={orderTotals(order)} title="Payment and price summary" showHints={false} style={styles.section}>
          <InfoRow icon={order.payment === 'wallet' ? 'wallet' : 'cash'} label="Payment method"
            value={[paymentLabel, paymentStatus].filter(Boolean).join(' \u00b7 ')} />
        </PriceSummary>

        {status === 'Received' ? (
          <View style={styles.section}>
            <AppButton title="Cancel order" icon="close-circle-outline" variant="dangerOutline" onPress={() => setConfirmCancel(true)} style={styles.cancelBtn} />
            <Text style={styles.cancelHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>You can cancel until the store starts preparing</Text>
          </View>
        ) : null}

        {delivered && order.rating ? (
          <FadeInView>
            <Card style={styles.section}>
              <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>Thanks for your feedback</Text>
              <View style={styles.starsRow}>
                <StarRating value={order.rating} readOnly size={26} />
              </View>
              {order.comment ? <Text style={styles.comment}>“{order.comment}”</Text> : null}
            </Card>
          </FadeInView>
        ) : null}

        {delivered && !order.rating ? (
          <FadeInView delay={250}>
            <Card style={styles.section}>
              <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>How was your order?</Text>
              <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>Rate {storeName}{order.courier ? ` and ${order.courier}` : ''}.</Text>
              <View style={styles.starsRow}>
                <StarRating
                  value={stars}
                  size={38}
                  onChange={(value) => {
                    haptics.tap();
                    setStars(value);
                    setRatingError('');
                  }}
                />
              </View>
              {ratingError ? <Text style={styles.error}>{ratingError}</Text> : null}
              <FlatList
                data={QUICK_TAGS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(tag) => tag}
                extraData={tags}
                style={styles.tagsList}
                renderItem={({ item: tag }) => <Chip label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />}
              />
              <AppInput
                placeholder="Add a comment (optional)"
                value={comment}
                onChangeText={setComment}
                multiline
                icon="chatbubble-outline"
                style={styles.commentInput}
              />
              <AppButton title="Submit rating" icon="star" onPress={submitRating} />
            </Card>
          </FadeInView>
        ) : null}
      </ScrollView>

      {active ? <NotificationPrompt /> : null}

      <ConfirmModal
        visible={confirmCancel}
        title="Cancel this order?"
        message={
          order.payment === 'wallet'
            ? `${formatMoney(order.total)} will be refunded to your wallet right away.`
            : 'The store will not prepare your order.'
        }
        icon="close-circle"
        tone="danger"
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primaryText} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
        <Text style={styles.infoValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
      </View>
    </View>
  );
}
