import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Switch, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import ConfirmModal from '../../components/ConfirmModal';
import DoorSign from '../../components/DoorSign';
import EmptyState from '../../components/EmptyState';
import PriceSummary from '../../components/PriceSummary';
import RoomPicker from '../../components/RoomPicker';
import StepIndicator from '../../components/StepIndicator';
import StickyBar from '../../components/StickyBar';
import { PressableScale, ShakeView, StaggerItem, animateLayout, useReduceMotion, useToast } from '../../components/motion';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { closedReason, formatTime, getDeliverySchedule, getNow, getSlotState, isStoreOpen, TRANSPORT_MINUTES } from '../../utils/time';
import { dateKey } from '../../utils/calendar';
import { bagItemDetails, getCartItemIssue, getPrintOrderIssue } from '../../utils/cart';
import { isRoomForBuilding, makeRoomCode, validateRoomParts } from '../../utils/validation';
import * as haptics from '../../utils/haptics';
import { createStyles } from './CheckoutScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';

const STEPS = ['Location', 'Delivery', 'Payment'];
const deliveryDateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export default function CheckoutScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { isOnline } = useNetwork();
  const { showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const {
    campus, cart: currentCart, cartTotals: currentTotals, wallet: currentWallet, savedLocations, timeOffsetMs, userCampusId, campusBuildings,
    getStore, getProduct, getBuilding, formatLocation, rewardApplied: currentRewardApplied, placeOrder,
  } = useApp();
  const reduceMotion = useReduceMotion();

  const campusLocations = savedLocations.filter((loc) => getBuilding(loc.buildingId)?.campusId === userCampusId);

  const [mode, setMode] = useState(campusLocations.length ? 'saved' : 'new');
  const [location, setLocation] = useState(null);
  const [roomValue, setRoomValue] = useState({ buildingId: null, floor: null, roomNumber: '' });
  const [saveLocation, setSaveLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [payment, setPayment] = useState(null);
  const [openStep, setOpenStep] = useState(0);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const listRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [reviewedPricing, setReviewedPricing] = useState(null);
  // Keep Checkout stable while the successful order clears the live Bag.
  const [confirmedCheckout, setConfirmedCheckout] = useState(null);
  const { cart, cartTotals, wallet, rewardApplied } = confirmedCheckout ?? {
    cart: currentCart, cartTotals: currentTotals, wallet: currentWallet, rewardApplied: currentRewardApplied,
  };
  const [tick, setTick] = useState(0);
  const shakeRef = useRef(null);
  const submitting = useRef(false);

  const store = getStore(cart.storeId);
  const storeOpen = Boolean(store && isStoreOpen(store, timeOffsetMs));
  const missing = cartTotals.total - wallet.balance;
  const walletShort = payment === 'wallet' && missing > 0;

  const now = getNow(timeOffsetMs);
  const today = dateKey(now);
  const deliveryDateLabel = deliveryDateFormat.format(now);
  const slotStates = campus.deliverySlots.map((slot) => ({ slot, state: getDeliverySchedule(slot, store, now) }));
  const availableSlots = slotStates.filter(({ state }) => !state.disabled);
  const slot = delivery?.date === today ? availableSlots.find((entry) => entry.slot.id === delivery.id)?.slot : null;

  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!delivery || slot) return;
    setDelivery(null);
    setReviewedPricing(null);
    setOpenStep((current) => current === 0 ? 0 : 1);
  }, [delivery, slot]);

  useEffect(() => {
    if (openStep !== 1 && openStep !== null) return;
    const timer = setTimeout(() => {
      if (openStep === null) listRef.current?.scrollToEnd({ animated: !reduceMotion });
      else if (availableSlots.length) listRef.current?.scrollToIndex({ index: 0, viewOffset: 120, animated: !reduceMotion });
    }, 200);
    return () => clearTimeout(timer);
  }, [openStep, availableSlots.length, reduceMotion]);

  if (cart.items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState icon="bag-handle-outline" title="Nothing to check out" subtitle="Your bag is empty." actionLabel="Back to bag" onAction={() => navigation.goBack()} />
      </View>
    );
  }

  const building = campusBuildings.find((entry) => entry.id === roomValue.buildingId);
  const roomErrors = validateRoomParts(roomValue);
  if (!building) roomErrors.building = 'Choose a building';
  else if (!building.floors.includes(roomValue.floor)) roomErrors.floor = 'Choose a floor in this building';
  const confirmedBuilding = campusBuildings.find(({ id }) => id === location?.buildingId);
  const locationDone = Boolean(location && isRoomForBuilding(confirmedBuilding, location.room));
  const paymentDone = payment === 'cash' || (payment === 'wallet' && !walletShort);
  const completed = [locationDone, Boolean(slot), paymentDone];

  const goToStep = (index) => {
    animateLayout();
    setErrors({});
    setOpenStep(index);
  };

  const pickSaved = (place) => {
    if (!isRoomForBuilding(getBuilding(place.buildingId), place.room)) {
      setErrors({ building: 'Choose another place or enter a new location.' });
      return;
    }
    haptics.tap();
    setLocation({ ...place, savedId: place.id });
    goToStep(1);
  };

  const changeRoom = (next) => {
    if (next.buildingId === roomValue.buildingId && next.floor === roomValue.floor && next.roomNumber === roomValue.roomNumber) return;
    setRoomValue(next);
    if (location) setLocation(null);
    setErrors({});
  };

  const confirmNewLocation = () => {
    const nextErrors = { ...roomErrors };
    if (saveLocation && !locationLabel.trim()) nextErrors.label = 'Enter a name for this place.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      shakeRef.current?.shake();
      return;
    }
    Keyboard.dismiss();
    setLocation({
      buildingId: building.id,
      room: makeRoomCode(building.code, roomValue.floor, roomValue.roomNumber),
      saveLocation,
      label: locationLabel.trim(),
    });
    goToStep(1);
  };

  const pickSlot = (item) => {
    const currentDate = dateKey(getNow(timeOffsetMs));
    if (currentDate !== today || !store || !isStoreOpen(store, timeOffsetMs) || getSlotState(item, store, timeOffsetMs).disabled) {
      setTick((n) => n + 1);
      return;
    }
    haptics.tap();
    setDelivery({ id: item.id, date: today });
    goToStep(2);
  };

  const pickPayment = (key) => {
    haptics.tap();
    setPayment(key);
    if (key === 'wallet' && missing > 0) return;
    goToStep(locationDone && slot ? null : !locationDone ? 0 : 1);
  };

  const checkoutIssue = (at = getNow(timeOffsetMs)) => {
    if (!isOnline) return "You're offline. Reconnect to place your order.";
    if (!store) return 'This store is no longer available.';
    if (!isStoreOpen(store, timeOffsetMs)) return closedReason(store, campus.deliverySlots, timeOffsetMs);
    const printIssue = getPrintOrderIssue(cart.items, campus.printPrices.maxPages);
    if (printIssue) return printIssue;
    if (cart.items.some((item) => getCartItemIssue(item, getProduct, campus.printPrices.maxPages, cart.storeId))) {
      return 'Review the unavailable or invalid items in your bag.';
    }
    if (!campus.deliverySlots.some((item) => !getDeliverySchedule(item, store, at).disabled)) return 'No delivery slots available.';
    if (cartTotals.missingForMinimum > 0) return `Add ${formatMoney(cartTotals.missingForMinimum)} more to reach the $2.00 minimum.`;
    if (!locationDone) return 'Choose your delivery location to continue.';
    if (!slot || today !== dateKey(at) || getDeliverySchedule(slot, store, at).disabled) {
      return 'Choose a delivery break to continue.';
    }
    if (!payment) return 'Choose a payment method to continue.';
    if (walletShort) return 'Insufficient wallet balance.';
    return '';
  };
  const blockReason = checkoutIssue();

  const handlePlaceOrder = () => {
    if (submitting.current || checkoutIssue()) return;
    Keyboard.dismiss();
    haptics.tap();
    setReviewedPricing({ total: cartTotals.total, discount: cartTotals.discount });
  };

  const confirmOrder = () => {
    if (!reviewedPricing || submitting.current) return;
    const confirmedAt = Date.now();
    if (checkoutIssue(new Date(confirmedAt + timeOffsetMs))) {
      setReviewedPricing(null);
      setTick((n) => n + 1);
      return;
    }
    submitting.current = true;
    setConfirmedCheckout({ cart, cartTotals, wallet, rewardApplied });
    setReviewedPricing(null);
    let order;
    try {
      order = placeOrder({
        buildingId: location.buildingId,
        room: location.room,
        slotId: slot.id,
        deliveryDate: delivery.date,
        payment,
        saveLocation: location.saveLocation,
        locationLabel: location.label,
        expectedPricing: reviewedPricing,
      }, confirmedAt);
    } catch (error) {
      console.log('Checkout failed', error.message);
    }
    if (!order) {
      submitting.current = false;
      setConfirmedCheckout(null);
      setTick((n) => n + 1);
      showToast({ message: 'Could not place the order. Check your bag, delivery slot and payment.', icon: 'alert-circle', tone: 'error' });
      return;
    }
    navigation.replace('OrderProcessing', { order });
  };

  // ----- Step header (number/check + title + summary or edit link) -----
  const stepHeader = (index, title, summary) => {
    const done = completed[index];
    const open = openStep === index;
    return (
      <PressableScale
        onPress={() => goToStep(index)}
        disabled={open}
        style={styles.stepHeader}
        accessibilityLabel={`${title} step${done ? ', completed' : ''}`}
        accessibilityState={{ expanded: open, disabled: open }}
      >
        <View style={[styles.stepBadge, done && styles.stepBadgeDone, open && !done && styles.stepBadgeOpen]}>
          {done ? (
            <Ionicons name="checkmark" size={16} color={colors.textOnDark} />
          ) : (
            <Text style={[styles.stepNumber, open && styles.stepNumberOpen]}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.flex}>
          <Text style={styles.stepTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text>
          {!open && summary ? (
            <Text style={styles.stepSummary} maxFontSizeMultiplier={MAX_FONT_SCALE}>{summary}</Text>
          ) : null}
        </View>
        {!open ? <Text style={styles.editLink}>{done ? 'Change' : 'Open'}</Text> : null}
      </PressableScale>
    );
  };

  const whereSummary = locationDone ? formatLocation(location.buildingId, location.room) : 'Not set yet';
  const selectedSchedule = availableSlots.find((entry) => entry.slot === slot)?.state;
  const whenSummary = selectedSchedule
    ? `${deliveryDateLabel} \u00b7 ${slot.label} \u00b7 ETA ${formatTime(new Date(selectedSchedule.delivered))}`
    : 'Not set yet';
  const paySummary = payment === 'wallet' ? 'Campus wallet' : payment === 'cash' ? 'Cash on delivery' : 'Not set yet';

  const whereContent = (
    <View>
      {campusLocations.length > 0 ? (
        <View style={styles.modeRow}>
          <PressableScale onPress={() => { animateLayout(); setMode('saved'); }} accessibilityState={{ selected: mode === 'saved' }}
            style={[styles.modeBtn, mode === 'saved' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, mode === 'saved' && styles.modeTextActive]}>Saved places</Text>
          </PressableScale>
          <PressableScale onPress={() => { animateLayout(); setMode('new'); }} accessibilityState={{ selected: mode === 'new' }}
            style={[styles.modeBtn, mode === 'new' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, mode === 'new' && styles.modeTextActive]}>New location</Text>
          </PressableScale>
        </View>
      ) : null}

      {mode === 'saved' ? (
        <FlatList
          data={campusLocations}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          extraData={location?.savedId}
          renderItem={({ item }) => {
            const selected = location?.savedId === item.id;
            const b = getBuilding(item.buildingId);
            return (
              <PressableScale onPress={() => pickSaved(item)} style={[styles.savedCard, selected && styles.savedCardSelected]} accessibilityState={{ selected }} accessibilityLabel={`Deliver to ${item.label}, ${formatLocation(item.buildingId, item.room)}`}>
                <DoorSign code={item.room} size="sm" />
                <View style={styles.savedInfo}>
                  <Text style={styles.savedLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.label}</Text>
                  <Text style={styles.savedMeta} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {b ? `${b.name} · ${b.landmarks}` : 'Saved place'}
                  </Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? colors.primary : colors.border} />
              </PressableScale>
            );
          }}
        />
      ) : (
        <View>
          <RoomPicker compact resetRoomOnBuildingChange buildings={campusBuildings} value={roomValue} onChange={changeRoom} errors={errors} />
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchLabel}>Save this location</Text>
              <Text style={styles.switchHint}>Reuse it with one tap next time</Text>
            </View>
            <Switch
              value={saveLocation}
              onValueChange={(v) => { animateLayout(); setSaveLocation(v); if (location && !location.savedId) setLocation(null); }}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={saveLocation ? colors.primary : colors.surface}
              accessibilityLabel="Save this location"
            />
          </View>
          {saveLocation ? (
            <AppInput icon="bookmark-outline" placeholder="Label, e.g. My Lab" value={locationLabel} onChangeText={(value) => { setLocationLabel(value); if (location && !location.savedId) setLocation(null); }} error={errors.label} maxLength={40} style={styles.labelInput} returnKeyType="done" />
          ) : null}
          <AppButton title="Continue" variant="secondary" icon="arrow-forward" small onPress={confirmNewLocation} style={styles.continueBtn} />
        </View>
      )}
      {mode === 'saved' && errors.building ? <Text style={styles.error}>{errors.building}</Text> : null}
    </View>
  );

  const header = (
    <View>
      {!storeOpen ? (
        <View style={styles.closedBanner}>
          <Ionicons name="moon" size={18} color={colors.dangerText} />
          <Text style={styles.closedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {closedReason(store, campus.deliverySlots, timeOffsetMs)}.
          </Text>
        </View>
      ) : null}

      <StepIndicator steps={STEPS} current={openStep} completed={completed} onStepPress={goToStep} />

      <ShakeView ref={shakeRef}>
        <View style={[styles.stepCard, openStep === 0 && styles.stepCardOpen]}>
          {stepHeader(0, STEPS[0], whereSummary)}
          {openStep === 0 ? whereContent : null}
        </View>

        <View style={[styles.stepCard, openStep === 1 && styles.stepCardOpen]}>
          {stepHeader(1, STEPS[1], whenSummary)}
          {openStep === 1 ? (
            <Text style={styles.stepHelp} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {deliveryDateLabel} {'\u00b7'} {store ? `${store.name} needs ${store.prepTime} min to prepare.` : ''}
            </Text>
          ) : null}
          {openStep === 1 && store && availableSlots.length > 0 ? (
            <Text style={styles.stepHelp} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {store.prepTime} min preparation + {TRANSPORT_MINUTES} min transportation
            </Text>
          ) : null}
          {openStep === 1 && !availableSlots.length ? (
            <Text style={styles.stepHelp} accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE}>No delivery slots available.</Text>
          ) : null}
        </View>
      </ShakeView>
    </View>
  );

  const unavailableSlots = slotStates.filter(({ state }) => state.disabled);
  const allPassed = unavailableSlots.every((x) => x.state.reason === 'Passed');
  const slotRows = [
    ...availableSlots.map((x) => ({ id: x.slot.id, type: 'slot', ...x })),
    ...(unavailableSlots.length ? [{ id: 'collapsed', type: 'collapsed' }] : []),
    ...(showUnavailable ? unavailableSlots.map((x) => ({ id: x.slot.id, type: 'slot', ...x })) : []),
  ];

  const renderSlot = ({ item: row, index }) => {
    if (row.type === 'collapsed') {
      const n = unavailableSlots.length;
      const label = allPassed ? `${n} earlier ${n === 1 ? 'break' : 'breaks'} passed` : `${n} unavailable ${n === 1 ? 'break' : 'breaks'}`;
      return (
        <View style={styles.slotWrap}>
          <PressableScale
            onPress={() => {
              animateLayout();
              setShowUnavailable((v) => !v);
            }}
            style={styles.collapsedRow}
            accessibilityLabel={`${label}, ${showUnavailable ? 'hide' : 'show'}`}
          >
            <Text style={styles.collapsedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
            <Ionicons name={showUnavailable ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </PressableScale>
        </View>
      );
    }
    const { slot: item, state } = row;
    const selected = slot?.id === item.id;
    return (
      <StaggerItem index={index} style={styles.slotWrap}>
        <PressableScale
          disabled={state.disabled}
          onPress={() => pickSlot(item)}
          accessibilityState={{ selected, disabled: state.disabled }}
          style={[styles.slotCard, selected && styles.slotSelected, state.disabled && styles.slotDisabled]}
          accessibilityLabel={`${item.label} break${state.disabled ? `, unavailable: ${state.reason}` : ''}`}
        >
          <View style={[styles.slotIcon, selected && styles.slotIconSelected]}>
            <Ionicons
              name={state.disabled ? 'lock-closed' : 'time-outline'}
              size={18}
              color={selected ? colors.textOnDark : state.disabled ? colors.textMuted : colors.primary}
            />
          </View>
          <View style={styles.slotInfo}>
            <Text style={[styles.slotLabel, state.disabled && styles.textMuted]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.label}</Text>
            <Text style={[styles.slotReason, !state.disabled && styles.slotAvailable]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {state.disabled ? state.reason : `Order by ${formatTime(new Date(state.deadline))}, ETA ${formatTime(new Date(state.delivered))}`}
            </Text>
          </View>
          {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.primaryText} /> : null}
        </PressableScale>
      </StaggerItem>
    );
  };

  // ----- Pay + Review -----
  const paymentCard = (key, icon, title, subtitle) => {
    const selected = payment === key;
    return (
      <PressableScale onPress={() => pickPayment(key)} style={[styles.payCard, selected && styles.payCardSelected]} accessibilityLabel={title} accessibilityState={{ selected }}>
        <View style={[styles.payIcon, selected && styles.payIconSelected]}>
          <Ionicons name={icon} size={20} color={selected ? colors.textOnDark : colors.primary} />
        </View>
        <View style={styles.payInfo}>
          <Text style={styles.payTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text>
          <Text style={styles.paySubtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{subtitle}</Text>
        </View>
        <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? colors.primary : colors.textMuted} />
      </PressableScale>
    );
  };

  const footer = (
    <View>
      <View style={[styles.stepCard, openStep === 2 && styles.stepCardOpen]}>
        {stepHeader(2, STEPS[2], paySummary)}
        {openStep === 2 ? (
          <View>
            {paymentCard('wallet', 'wallet', 'Campus wallet', `Balance ${formatMoney(wallet.balance)}`)}
            {missing > 0 ? (
              <View style={styles.insufficient}>
                <View style={styles.flex}>
                  <Text style={styles.insufficientTitle}>Missing {formatMoney(missing)}</Text>
                  <Text style={styles.insufficientText}>Insufficient wallet balance. Top up or choose cash on delivery.</Text>
                </View>
                <AppButton title="Top up" small variant="danger" onPress={() => navigation.navigate('Wallet')} />
              </View>
            ) : null}
            {paymentCard('cash', 'cash', 'Cash on delivery', 'Pay when your order arrives.')}
            {payment === 'wallet' && !walletShort ? (
              <Text style={styles.stepHelp} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Balance after payment: {formatMoney(wallet.balance - cartTotals.total)}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {completed.every(Boolean) ? (
        <>
          <Text style={styles.sectionTitle} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Review</Text>
          <View style={styles.reviewCard}>
            <View style={styles.reviewRow}>
              <Ionicons name="bag-handle-outline" size={18} color={colors.primaryText} />
              <Text style={styles.reviewText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {cartTotals.count} {cartTotals.count === 1 ? 'item' : 'items'} from {store ? store.name : 'the store'}
              </Text>
            </View>
            <FlatList data={cart.items} scrollEnabled={false} keyExtractor={(item) => item.key} renderItem={({ item }) => {
              const details = bagItemDetails(item);
              return (
                <View key={item.key} style={styles.reviewItem}>
                  <Text style={styles.reviewItemTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.qty} {'\u00d7'} {item.name}</Text>
                  {details ? <Text style={styles.reviewItemDetails} maxFontSizeMultiplier={MAX_FONT_SCALE}>{details}</Text> : null}
                </View>
              );
            }} />
            <SummaryRow label="Deliver to" value={whereSummary} />
            <SummaryRow label="Delivery break" value={whenSummary} />
            <SummaryRow label="Payment" value={paySummary} />
            {payment === 'wallet' ? (
              <SummaryRow label="Balance after payment" value={formatMoney(wallet.balance - cartTotals.total)} />
            ) : null}
          </View>
        </>
      ) : null}
      <PriceSummary title="Order summary" totals={cartTotals} showHints={false} style={styles.priceSummary} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>

      <FlatList
        ref={listRef}
        onScrollToIndexFailed={() => {}}
        data={openStep === 1 ? slotRows : []}
        keyExtractor={(item) => item.id}
        renderItem={renderSlot}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        extraData={{ delivery, tick, timeOffsetMs, openStep, showUnavailable }}
        showsVerticalScrollIndicator={false}
      />

      <StickyBar style={styles.placeBar}>
        <AppButton
          title={`Place order · ${formatMoney(cartTotals.total)}`}
          icon="checkmark-circle"
          onPress={handlePlaceOrder}
          small
          disabled={Boolean(blockReason)}
          reason={blockReason}
        />
      </StickyBar>

      <ConfirmModal
        visible={Boolean(reviewedPricing)}
        title="Confirm your order"
        icon="receipt"
        confirmLabel="Place order"
        onConfirm={confirmOrder}
        onCancel={() => setReviewedPricing(null)}
      >
        <View style={styles.summaryBox}>
          <SummaryRow label="Store" value={store ? store.name : ''} />
          <SummaryRow label="Items" value={String(cartTotals.count)} />
          <SummaryRow label="Deliver to" value={whereSummary} />
          <SummaryRow label="Break" value={whenSummary} />
          <SummaryRow label="Payment" value={payment === 'wallet' ? 'Campus wallet' : 'Cash on delivery'} />
          {rewardApplied ? <SummaryRow label="Coffee reward discount" value={`−${formatMoney(cartTotals.discount)}`} /> : null}
          <SummaryRow label="Total" value={formatMoney(cartTotals.total)} strong />
        </View>
      </ConfirmModal>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value, strong }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
    </View>
  );
}
