import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Switch, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import ConfirmModal from '../../components/ConfirmModal';
import DoorSign from '../../components/DoorSign';
import EmptyState from '../../components/EmptyState';
import OrderSuccessModal from '../../components/OrderSuccessModal';
import PriceSummary from '../../components/PriceSummary';
import RoomPicker from '../../components/RoomPicker';
import StepIndicator from '../../components/StepIndicator';
import StickyBar from '../../components/StickyBar';
import { PressableScale, ShakeView, StaggerItem, animateLayout, useReduceMotion } from '../../components/motion';
import { durations, easings } from '../../theme/motion';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { closedReason, getSlotState, isStoreOpen, orderByTime } from '../../utils/time';
import { makeRoomCode, validateCheckoutSteps, validateRoomParts } from '../../utils/validation';
import * as haptics from '../../utils/haptics';
import { createStyles } from './CheckoutScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';

const STEPS = ['Where', 'When', 'Pay'];

// Place order morph: the button shrinks to a circle (width + radius) while placing; the success screen follows
function MorphWidth({ active, children }) {
  const reduceMotion = useReduceMotion();
  const [full, setFull] = useState(0);
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = reduceMotion ? 0 : withTiming(active ? 1 : 0, { duration: durations.medium, easing: easings.standard });
  }, [active, reduceMotion]);
  const style = useAnimatedStyle(() => (full ? { width: full - (full - 52) * p.value, borderRadius: 12 + 14 * p.value } : {}));
  return (
    <View onLayout={(e) => !full && setFull(e.nativeEvent.layout.width)} style={{ alignItems: 'center' }}>
      <Reanimated.View style={[{ overflow: 'hidden', alignSelf: 'center' }, full ? style : { alignSelf: 'stretch' }]}>{children}</Reanimated.View>
    </View>
  );
}

// Checkout: 3-step flow (Where → When → Pay) in ONE FlatList (slots are the data, steps are header/footer)
export default function CheckoutScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { isOnline } = useNetwork();
  const {
    campus, cart, cartTotals, wallet, savedLocations, timeOffsetMs, userCampusId, campusBuildings,
    getStore, getBuilding, getSlot, placeOrder, formatLocation, rewardApplied, orders,
  } = useApp();
  const reduceMotion = useReduceMotion();

  const campusLocations = savedLocations.filter((loc) => getBuilding(loc.buildingId)?.campusId === userCampusId);

  // Pre-select a saved place: the only one, or the one used by the last order (the student can still change it)
  const lastUsed = campusLocations.find((loc) => orders.some((o) => !o.cancelled && o.building === loc.buildingId && o.room === loc.room));
  const defaultSaved = campusLocations.length === 1 ? campusLocations[0] : lastUsed || null;
  const [mode, setMode] = useState(campusLocations.length ? 'saved' : 'new');
  const [savedId, setSavedId] = useState(defaultSaved ? defaultSaved.id : null);
  const [roomValue, setRoomValue] = useState({ buildingId: null, floor: null, roomNumber: '' });
  const [saveLocation, setSaveLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [slotId, setSlotId] = useState(null);
  const [payment, setPayment] = useState(null);
  const [openStep, setOpenStep] = useState(defaultSaved ? 1 : 0);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [placing, setPlacing] = useState(false);
  const listRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [tick, setTick] = useState(0);
  const shakeRef = useRef(null);

  const store = getStore(cart.storeId);
  const storeOpen = store ? isStoreOpen(store, timeOffsetMs) : false;
  const missing = cartTotals.total - wallet.balance;
  const walletShort = payment === 'wallet' && missing > 0;

  // Chapter 19: useEffect with cleanup — re-check slots every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // When opens: scroll to the first available break (available breaks come first)
  useEffect(() => {
    if (openStep !== 1) return undefined;
    const id = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index: 0, viewOffset: 120, animated: !reduceMotion });
      } catch (error) {
        // list not measured yet
      }
    }, 200);
    return () => clearTimeout(id);
  }, [openStep]);

  // Clear the chosen slot if time moved on and it is no longer available
  useEffect(() => {
    const slot = getSlot(slotId);
    if (slot && getSlotState(slot, store, timeOffsetMs).disabled) setSlotId(null);
  }, [tick, slotId, timeOffsetMs]);

  // After the order is placed the cart is empty, so show only the success modal
  if (successOrder) {
    const slot = getSlot(successOrder.slotId);
    return (
      <View style={styles.screen}>
        <OrderSuccessModal
          visible
          orderNumber={successOrder.number}
          slotLabel={slot ? slot.label : ''}
          roomCode={successOrder.room}
          onTrack={() => {
            const orderId = successOrder.id;
            setSuccessOrder(null);
            navigation.popToTop();
            navigation.navigate('Tracking', { orderId });
          }}
        />
      </View>
    );
  }

  if (cart.items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState icon="bag-handle-outline" title="Nothing to check out" subtitle="Your bag is empty." actionLabel="Back to bag" onAction={() => navigation.goBack()} />
      </View>
    );
  }

  // ----- Derived location -----
  const savedLocation = campusLocations.find((l) => l.id === savedId);
  const newBuilding = getBuilding(roomValue.buildingId);
  const roomErrors = validateRoomParts(roomValue);
  const newRoomCode = newBuilding && !Object.keys(roomErrors).length
    ? makeRoomCode(newBuilding.code, roomValue.floor, roomValue.roomNumber)
    : '';
  const buildingId = mode === 'saved' ? savedLocation?.buildingId : roomValue.buildingId;
  const room = mode === 'saved' ? savedLocation?.room : newRoomCode;

  const whereDone = Boolean(buildingId && room);
  const whenDone = Boolean(slotId);
  const payDone = Boolean(payment) && !walletShort;
  const completed = [whereDone, whenDone, payDone];
  const slot = getSlot(slotId);

  // Moving between steps clears old errors: they only appear after Continue / Place order is pressed
  const goToStep = (index) => {
    animateLayout();
    setErrors({});
    setOpenStep(index);
  };

  const pickSaved = (location) => {
    haptics.tap();
    setSavedId(location.id);
    setErrors((e) => ({ ...e, building: null, floor: null, room: null }));
    goToStep(1);
  };

  const changeRoom = (next) => {
    setRoomValue(next);
    setErrors((e) => ({ ...e, building: null, floor: null, room: null }));
  };

  const confirmNewLocation = () => {
    if (Object.keys(roomErrors).length) {
      setErrors((e) => ({ ...e, ...roomErrors }));
      shakeRef.current?.shake();
      return;
    }
    goToStep(1);
  };

  const pickSlot = (id) => {
    haptics.tap();
    setSlotId(id);
    setErrors((e) => ({ ...e, slot: null }));
    goToStep(2);
  };

  const pickPayment = (key) => {
    haptics.tap();
    animateLayout();
    setPayment(key);
    setErrors((e) => ({ ...e, payment: null }));
  };

  // Hard blocks disable the button (with a reason); missing steps keep it enabled and shake on press
  let blockReason = '';
  if (!isOnline) blockReason = "You're offline. Reconnect to place your order.";
  else if (!storeOpen) blockReason = closedReason(store, campus.deliverySlots, timeOffsetMs);
  else if (cartTotals.missingForMinimum > 0) blockReason = `Add ${formatMoney(cartTotals.missingForMinimum)} more to reach the $2.00 minimum`;
  else if (walletShort) blockReason = `Top up ${formatMoney(missing)} or choose cash on delivery`;

  let nextHint = '';
  if (!whereDone) nextHint = 'Add your delivery room to continue';
  else if (!whenDone) nextHint = 'Choose a delivery break to continue';
  else if (!payment) nextHint = 'Choose how you want to pay';

  const handlePlaceOrder = () => {
    const found = validateCheckoutSteps({
      buildingId,
      floor: roomValue.floor,
      roomNumber: roomValue.roomNumber,
      room: mode === 'saved' ? room : undefined,
      slotId,
      payment,
    });
    if (mode === 'saved' && !savedLocation) found.building = 'Choose a saved location or add a new one';
    if (Object.keys(found).length) {
      shakeRef.current?.shake();
      if (found.building || found.floor || found.room) goToStep(0);
      else if (found.slot) goToStep(1);
      else goToStep(2);
      setErrors(found); // after goToStep, which clears errors
      return;
    }
    setErrors({});
    haptics.tap();
    setShowSummary(true);
  };

  const confirmOrder = () => {
    setShowSummary(false);
    setPlacing(true); // the button shrinks to a spinner, then the success screen opens
    setTimeout(() => {
      const order = placeOrder({
        buildingId,
        room,
        slotId,
        payment,
        saveLocation: mode === 'new' && saveLocation,
        locationLabel,
      });
      setPlacing(false);
      if (!order) return;
      haptics.success();
      setSuccessOrder(order);
    }, reduceMotion ? 0 : 650);
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
            <Text style={styles.stepSummary} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{summary}</Text>
          ) : null}
        </View>
        {!open ? <Text style={styles.editLink}>{done ? 'Change' : 'Open'}</Text> : null}
      </PressableScale>
    );
  };

  const whereSummary = whereDone ? formatLocation(buildingId, room) : 'Not set yet';
  const whenSummary = slot ? `${slot.label} break` : 'Not set yet';
  const paySummary = payment === 'wallet' ? `Campus wallet · ${formatMoney(wallet.balance)}` : payment === 'cash' ? 'Cash on delivery' : 'Not set yet';

  // ----- Where -----
  const whereContent = (
    <View>
      {campusLocations.length > 0 ? (
        <View style={styles.modeRow}>
          <PressableScale onPress={() => { animateLayout(); setMode('saved'); }} style={[styles.modeBtn, mode === 'saved' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, mode === 'saved' && styles.modeTextActive]}>Saved places</Text>
          </PressableScale>
          <PressableScale onPress={() => { animateLayout(); setMode('new'); }} style={[styles.modeBtn, mode === 'new' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, mode === 'new' && styles.modeTextActive]}>New location</Text>
          </PressableScale>
        </View>
      ) : null}

      {mode === 'saved' ? (
        <FlatList
          data={campusLocations}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          extraData={savedId}
          renderItem={({ item }) => {
            const selected = savedId === item.id;
            const b = getBuilding(item.buildingId);
            return (
              <PressableScale onPress={() => pickSaved(item)} style={[styles.savedCard, selected && styles.savedCardSelected]} accessibilityLabel={`Deliver to ${item.label}`}>
                <DoorSign code={item.room} size="sm" />
                <View style={styles.savedInfo}>
                  <Text style={styles.savedLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.label}</Text>
                  <Text style={styles.savedMeta} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
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
          <RoomPicker buildings={campusBuildings} value={roomValue} onChange={changeRoom} errors={errors} />
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchLabel}>Save this location</Text>
              <Text style={styles.switchHint}>Reuse it with one tap next time</Text>
            </View>
            <Switch
              value={saveLocation}
              onValueChange={(v) => { animateLayout(); setSaveLocation(v); }}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={saveLocation ? colors.primary : colors.surface}
              accessibilityLabel="Save this location"
            />
          </View>
          {saveLocation ? (
            <AppInput icon="bookmark-outline" placeholder="Label, e.g. My Lab" value={locationLabel} onChangeText={setLocationLabel} style={styles.labelInput} returnKeyType="done" />
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
          {stepHeader(0, 'Where', whereSummary)}
          {openStep === 0 ? whereContent : null}
        </View>

        <View style={[styles.stepCard, openStep === 1 && styles.stepCardOpen]}>
          {stepHeader(1, 'When', whenSummary)}
          {openStep === 1 ? (
            <Text style={styles.stepHelp} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              We deliver between classes, never during. {store ? `${store.name} needs ${store.prepTime} min to prepare.` : ''}
            </Text>
          ) : null}
          {openStep === 1 && errors.slot ? <Text style={styles.error}>{errors.slot}</Text> : null}
        </View>
      </ShakeView>
    </View>
  );

  // ----- When (FlatList data) -----
  // Available breaks come first; the passed / unavailable ones fold into ONE row ("5 earlier breaks passed") that expands
  const slotStates = campus.deliverySlots.map((slotItem) => ({ slot: slotItem, state: getSlotState(slotItem, store, timeOffsetMs) }));
  const availableSlots = slotStates.filter((x) => !x.state.disabled);
  const unavailableSlots = slotStates.filter((x) => x.state.disabled);
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
    const selected = slotId === item.id;
    return (
      <StaggerItem index={index} style={styles.slotWrap}>
        <PressableScale
          disabled={state.disabled}
          onPress={() => pickSlot(item.id)}
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
              {state.disabled ? state.reason : `Order by ${orderByTime(item, store)}`}
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
      <PressableScale onPress={() => pickPayment(key)} style={[styles.payCard, selected && styles.payCardSelected]} accessibilityLabel={title}>
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
        {stepHeader(2, 'Pay', paySummary)}
        {openStep === 2 ? (
          <View>
            {paymentCard('wallet', 'wallet', 'Campus wallet', `Balance ${formatMoney(wallet.balance)}`)}
            {walletShort ? (
              <View style={styles.insufficient}>
                <View style={styles.flex}>
                  <Text style={styles.insufficientTitle}>Missing {formatMoney(missing)}</Text>
                  <Text style={styles.insufficientText}>Insufficient balance – top up and come back</Text>
                </View>
                <AppButton title="Top up" small variant="danger" onPress={() => navigation.navigate('Wallet')} />
              </View>
            ) : null}
            {paymentCard('cash', 'cash', 'Cash on delivery', 'Pay the courier when it arrives')}
            {errors.payment ? <Text style={styles.error}>{errors.payment}</Text> : null}
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Review</Text>
      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Ionicons name="bag-handle-outline" size={18} color={colors.primaryText} />
          <Text style={styles.reviewText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {cartTotals.count} {cartTotals.count === 1 ? 'item' : 'items'} from {store ? store.name : 'the store'}
          </Text>
        </View>
        {rewardApplied ? (
          <View style={styles.reviewRow}>
            <Text style={styles.rewardEmoji}>🎁</Text>
            <Text style={styles.reviewText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Free coffee applied</Text>
          </View>
        ) : null}
        {whereDone ? (
          <View style={styles.reviewRow}>
            <Ionicons name="location-outline" size={18} color={colors.primaryText} />
            <Text style={styles.reviewText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{whereSummary}</Text>
          </View>
        ) : null}
      </View>
      <PriceSummary totals={cartTotals} showHints={false} />
    </View>
  );

  return (
    <View style={styles.screen}>
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
        extraData={{ slotId, tick, timeOffsetMs, openStep, showUnavailable }}
        showsVerticalScrollIndicator={false}
      />

      <StickyBar>
        <MorphWidth active={placing}>
        <AppButton
          loading={placing}
          title={`Place order · ${formatMoney(cartTotals.total)}`}
          icon="checkmark-circle"
          onPress={handlePlaceOrder}
          disabled={Boolean(blockReason)}
          dimmed={Boolean(nextHint)}
          reason={blockReason || nextHint}
        />
        </MorphWidth>
      </StickyBar>

      <ConfirmModal
        visible={showSummary}
        title="Confirm your order"
        icon="receipt"
        confirmLabel="Place order"
        onConfirm={confirmOrder}
        onCancel={() => setShowSummary(false)}
      >
        <View style={styles.summaryBox}>
          <SummaryRow label="Store" value={store ? store.name : ''} />
          <SummaryRow label="Items" value={String(cartTotals.count)} />
          <SummaryRow label="Deliver to" value={whereDone ? formatLocation(buildingId, room) : ''} />
          <SummaryRow label="Break" value={slot ? slot.label : ''} />
          <SummaryRow label="Payment" value={payment === 'wallet' ? 'Campus wallet' : 'Cash on delivery'} />
          {rewardApplied ? <SummaryRow label="Free coffee" value={`−${formatMoney(cartTotals.discount)}`} /> : null}
          <SummaryRow label="Total" value={formatMoney(cartTotals.total)} strong />
        </View>
      </ConfirmModal>
    </View>
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
