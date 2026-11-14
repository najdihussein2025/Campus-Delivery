import React, { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import ConfirmModal from '../../components/ConfirmModal';
import NotificationPrompt from '../../components/NotificationPrompt';
import DoorSign from '../../components/DoorSign';
import EmptyState from '../../components/EmptyState';
import StarRating from '../../components/StarRating';
import StatusTimeline from '../../components/StatusTimeline';
import { AnimatedProgressBar, FadeInView, PulseDot, SuccessCheck, useToast } from '../../components/motion';
import { gradients, MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { getOrderStatus, getRouteProgress, getStepProgress } from '../../utils/orderStatus';
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

const headlineFor = (status, order, storeName, itemCount) => {
  const items = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
  switch (status) {
    case 'Received':
      return { title: 'Order received', sub: `${storeName} got your order of ${items}` };
    case 'Preparing':
      return { title: 'Preparing your order', sub: `${storeName} is preparing ${items}` };
    case 'On the way':
      return { title: 'On the way to you', sub: `${order.courier} is heading to room ${order.room}` };
    case 'Delivered':
      return { title: 'Delivered – enjoy!', sub: `${order.courier} dropped it at room ${order.room}` };
    default:
      return { title: 'Order cancelled', sub: 'This order will not be prepared' };
  }
};

// Tracking: route params + status computed from elapsed time + 1 s interval with cleanup
export default function TrackingScreen({ route, navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { orderId } = route.params;
  const { orders, getStore, getSlot, cancelOrder, rateOrder, formatLocation, settle, lastSettlement } = useApp();
  const { showToast } = useToast();
  const [nowMs, setNowMs] = useState(Date.now());
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [earnedReward, setEarnedReward] = useState(false);
  const feedbackShown = useRef(false);

  // Chapter 19: the brief's required timer — setInterval every second, cleared in the cleanup.
  // The status itself comes from timestamps, so the timer only refreshes `now` (and settles loyalty stamps).
  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
      settle();
    }, 1000);
    return () => clearInterval(id);
  }, [settle]);

  // Back from the background: recompute right away (the order may have moved on while the app was closed)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNowMs(Date.now());
        settle();
      }
    });
    return () => sub.remove();
  }, [settle]);

  // Tell the notification handler which order is on screen (no banner for it) and clear its tray entries
  useEffect(() => {
    setViewing('Tracking', orderId);
    dismissOrderNotifications(orderId);
    return () => setViewing(null);
  }, [orderId]);

  // Stamp feedback: "+2 stamps ☕", and a celebration when this order completed the card
  useEffect(() => {
    // Only react to a fresh settlement (not an old one when the screen is reopened later)
    if (!lastSettlement || feedbackShown.current || Date.now() - lastSettlement.at > 60000) return;
    const mine = lastSettlement.items.find((i) => i.orderId === orderId);
    if (!mine) return;
    feedbackShown.current = true;
    showToast({ message: `+${mine.stamps} ${mine.stamps === 1 ? 'stamp' : 'stamps'} ☕`, icon: 'cafe', tone: 'success' });
    if (mine.completed) {
      setEarnedReward(true);
      haptics.success();
    }
  }, [lastSettlement]);

  const order = orders.find((o) => o.id === orderId);
  const status = order ? getOrderStatus(order, nowMs) : null;
  const delivered = status === 'Delivered';

  // Success haptic only when the order turns "Delivered" while this screen is open
  const wasDelivered = useRef(delivered);
  useEffect(() => {
    if (delivered && !wasDelivered.current) haptics.success();
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
  const slot = getSlot(order.slotId);
  const progress = getStepProgress(order, nowMs);
  const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
  const headline = headlineFor(status, order, storeName, itemCount);
  const routeProgress = getRouteProgress(order, nowMs);
  const stampCount = stampsForOrder(order);
  const roomParts = String(order.room).split('.');
  const floorLabel = roomParts.length === 3 ? (roomParts[1] === '0' ? 'Ground floor' : `Floor ${roomParts[1]}`) : '';

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
    rateOrder(order.id, stars, text);
    haptics.success();
    showToast({ message: 'Thanks for your feedback', icon: 'star', tone: 'success' });
  };

  const handleCancel = () => {
    const ok = cancelOrder(order.id);
    setConfirmCancel(false);
    if (!ok) {
      showToast({ message: 'Too late – the store already started preparing', icon: 'alert-circle', tone: 'error' });
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={order.cancelled ? [colors.textBrand, colors.primaryDark] : gradients.brand} style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroMicro} maxFontSizeMultiplier={MAX_FONT_SCALE}>Order #{order.number}</Text>
            <Badge status={status} />
          </View>
          <View style={styles.headlineRow}>
            {!order.cancelled && !delivered ? <PulseDot color={colors.accent} size={10} /> : null}
            <Text style={[styles.heroTitle, !order.cancelled && !delivered && styles.heroTitleLive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {headline.title}
            </Text>
          </View>
          <Text style={styles.heroSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>{headline.sub}</Text>

          {!order.cancelled ? (
            <View style={styles.routeBox}>
              <AnimatedProgressBar
                progress={routeProgress}
                color={colors.accent}
                trackColor="rgba(255,255,255,0.22)"
                height={6}
                thumbIcon="bicycle"
              />
              <View style={styles.routeLabels}>
                <Text style={styles.routeLabel}>Store</Text>
                <Text style={styles.routeLabel}>Your room</Text>
              </View>
            </View>
          ) : null}

          {!order.cancelled && !progress.done ? (
            <View style={styles.countdown}>
              <Ionicons name="timer-outline" size={16} color={colors.accent} />
              <Text style={styles.countdownText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Next update in <Text style={styles.countdownStrong}>{progress.secondsToNext}s</Text>
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {delivered ? (
          <FadeInView style={styles.deliveredBox}>
            <SuccessCheck size={84} />
            <Text style={styles.deliveredText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Your order has arrived</Text>
            {earnedReward ? (
              <Text style={styles.rewardText} maxFontSizeMultiplier={MAX_FONT_SCALE}>🎁 You earned a free coffee!</Text>
            ) : stampCount > 0 && order.stampsCredited ? (
              <Text style={styles.stampText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                +{stampCount} {stampCount === 1 ? 'stamp' : 'stamps'} ☕ added to your card
              </Text>
            ) : null}
          </FadeInView>
        ) : null}

        <Card style={[styles.section, styles.etaCard]}>
          <View style={styles.flex}>
            <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>{delivered ? 'Delivered during' : 'Arriving'}</Text>
            <Text style={styles.etaTime} maxFontSizeMultiplier={MAX_FONT_SCALE}>{slot ? slot.label : '—'}</Text>
            <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatLocation(order.building, order.room)}</Text>
          </View>
          <DoorSign code={order.room} subtitle={floorLabel} size="md" />
        </Card>

        <Card style={styles.section}>
          <StatusTimeline currentIndex={progress.index} stepTimes={progress.stepTimes} cancelled={order.cancelled} />
        </Card>

        <Card style={[styles.section, styles.row]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(order.courier)}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>Your courier</Text>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{order.courier}</Text>
            <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {status === 'On the way' ? 'On the way on a scooter 🛵' : 'Delivers on a scooter 🛵'}
            </Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <InfoRow
            icon={order.payment === 'wallet' ? 'wallet' : 'cash'}
            label="Payment"
            value={`${order.payment === 'wallet' ? 'Campus wallet' : 'Cash on delivery'} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          />
          {order.rewardUsed ? (
            <>
              <View style={styles.divider} />
              <InfoRow icon="gift" label="Loyalty" value={`🎁 Free coffee applied · −${formatMoney(order.discount)}`} />
            </>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Total</Text>
            <Text style={styles.totalValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(order.total)}</Text>
          </View>
        </Card>

        {status === 'Received' ? (
          <View style={styles.section}>
            <AppButton title="Cancel order" icon="close-circle-outline" variant="secondary" onPress={() => setConfirmCancel(true)} style={styles.cancelBtn} />
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
              <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>Rate {storeName} and {order.courier}.</Text>
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
              <View style={styles.tagsWrap}>
                {QUICK_TAGS.map((tag) => (
                  <Chip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
                ))}
              </View>
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

      <NotificationPrompt />

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
