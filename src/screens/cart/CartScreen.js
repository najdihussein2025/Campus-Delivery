import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Reanimated, { FadeOut, Extrapolation, LinearTransition, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import PriceSummary from '../../components/PriceSummary';
import ProductImage from '../../components/ProductImage';
import QuantitySelector from '../../components/QuantitySelector';
import StickyBar from '../../components/StickyBar';
import { AnimatedNumber, AnimatedProgressBar, PressableScale, StaggerItem, useReduceMotion, useToast } from '../../components/motion';
import { REDUCED_FADE_MS } from '../../theme/motion';
import { getCategoryColors, getCategoryIcon, MAX_FONT_SCALE } from '../../theme/theme';
import { FREE_DELIVERY_OVER, formatMoney } from '../../utils/money';
import { bagItemDetails, getCartItemIssue, getPrintOrderIssue, hasProductOptions } from '../../utils/cart';
import { closedReason, getSlotState, isStoreOpen } from '../../utils/time';
import * as haptics from '../../utils/haptics';
import { createStyles } from './CartScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

// Red action revealed by swiping a bag row left: the trash icon grows with the swipe distance
function DeleteAction({ progress, styles, color }) {
  const icon = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1.25], Extrapolation.CLAMP) }],
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 1, 1], Extrapolation.CLAMP),
  }));
  // Invisible until the row is actually pulled, so no red edge peeks out
  const shown = useAnimatedStyle(() => ({ opacity: progress.value > 0.02 ? 1 : 0 }));
  return (
    <Reanimated.View style={[styles.deleteAction, shown]}>
      <Reanimated.View style={icon}>
        <Ionicons name="trash" size={24} color={color} />
      </Reanimated.View>
    </Reanimated.View>
  );
}

// "Your bag": FlatList of items + useContext cart state + toast with Undo after removing
export default function CartScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const {
    campus, cart, cartTotals, getStore, getProduct, changeQty, removeItem, restoreItem, clearCart, timeOffsetMs,
    loyalty, rewardAvailable, rewardCoffee, rewardApplied, setUseReward,
  } = useApp();
  const { showToast } = useToast();
  const focused = useIsFocused();
  const [confirmClear, setConfirmClear] = useState(false);
  const [, setAvailabilityTick] = useState(0);
  const reduceMotion = useReduceMotion();

  const store = getStore(cart.storeId);
  const { missingForFreeDelivery } = cartTotals;
  const freeUnlocked = missingForFreeDelivery === 0;
  const rewardItem = rewardApplied ? rewardCoffee.item : null;
  const remainingRewards = Math.max(0, (loyalty?.rewards ?? 0) - 1);
  const storeOpen = store && isStoreOpen(store, timeOffsetMs);

  const itemIssue = (item) => getCartItemIssue(item, getProduct, campus.printPrices.maxPages, cart.storeId);
  const checkoutIssue = () => {
    if (!store) return 'This store is no longer available.';
    if (!isStoreOpen(store, timeOffsetMs)) return closedReason(store, campus.deliverySlots, timeOffsetMs);
    const printIssue = getPrintOrderIssue(cart.items, campus.printPrices.maxPages);
    if (printIssue) return printIssue;
    if (cart.items.some(itemIssue)) return 'Review the unavailable or invalid items in your bag.';
    if (!campus.deliverySlots.some((slot) => !getSlotState(slot, store, timeOffsetMs).disabled)) {
      return 'No delivery slots are available for this store today.';
    }
    if (cartTotals.missingForMinimum > 0) {
      return `Add ${formatMoney(cartTotals.missingForMinimum)} more to reach the $2.00 minimum${rewardApplied ? ' after the reward' : ''}.`;
    }
    return '';
  };

  useEffect(() => {
    if (!focused || !cart.items.length) return;
    const timer = setInterval(() => setAvailabilityTick((tick) => tick + 1), 10000);
    return () => clearInterval(timer);
  }, [focused, cart.items.length]);

  useEffect(() => {
    if (!focused || cart.items.length === 0) setConfirmClear(false);
  }, [focused, cart.items.length]);

  // Remove: the row collapses (LayoutAnimation) and a toast offers Undo
  const handleRemove = (item) => {
    const index = cart.items.findIndex((i) => i.key === item.key);
    const storeId = cart.storeId;
    removeItem(item.key);
    haptics.tap();
    showToast({
      message: `Removed ${item.name}`,
      icon: 'trash-outline',
      actionLabel: 'Undo',
      onAction: () => {
        const issue = restoreItem(item, index, storeId);
        if (issue) showToast({ message: issue, icon: 'alert-circle', tone: 'error' });
      },
    });
  };

  const renderItem = ({ item, index }) => {
    const issue = itemIssue(item);
    const details = bagItemDetails(item);
    const isPrint = item.type === 'print';
    const product = !isPrint && (getProduct(item.productId) || getProduct(item.key.split('|')[0]));
    const canEdit = isPrint || (!issue && hasProductOptions(product));
    const rewarded = item === rewardItem;
    const lineTotal = item.unitPrice * item.qty;
    const editOptions = canEdit ? (
      <PressableScale
        onPress={() => {
          if (isPrint) navigation.navigate('EditPrintJob', { editKey: item.key });
          else navigation.navigate('ProductDetails', { productId: item.productId, editKey: item.key });
        }}
        accessibilityLabel={'Edit options for ' + item.name}
        style={styles.editButton}
      >
        <Text style={styles.editText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Edit options</Text>
      </PressableScale>
    ) : null;
    return (
      <Reanimated.View exiting={reduceMotion ? FadeOut.duration(REDUCED_FADE_MS) : FadeOut.duration(220)} style={styles.itemWrap}>
        <ReanimatedSwipeable
          renderRightActions={(progress) => <DeleteAction progress={progress} styles={styles} color={colors.textOnDark} />}
          rightThreshold={72}
          overshootRight={false}
          friction={2}
          onSwipeableOpen={() => handleRemove(item)}
        >
          <StaggerItem index={index}>
            <View style={styles.itemCard}>
              <ProductImage
                category={item.category || product?.category || (isPrint ? 'Printing' : null)}
                productId={product?.id || item.productId}
                size={60}
                rounded={12}
                style={styles.thumb}
              />
              <View style={styles.itemInfo}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemName} numberOfLines={isPrint ? undefined : 2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.name}</Text>
                  <PressableScale
                    onPress={() => handleRemove(item)}
                    hitSlop={10}
                    style={styles.removeBtn}
                    accessibilityLabel={`Remove ${item.name}`}
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </PressableScale>
                </View>
                {isPrint && details ? <Text style={styles.itemDetails} maxFontSizeMultiplier={MAX_FONT_SCALE}>{details}</Text> : null}
                {!isPrint ? (
                  <Text style={styles.unitPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {[details, formatMoney(item.unitPrice) + ' each'].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
                {issue ? <Text style={styles.itemIssue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{issue}</Text> : null}
                {rewarded ? (
                  <View style={styles.itemRewardRow}>
                    <Ionicons name="gift-outline" size={15} color={colors.successText} />
                    <Text style={[styles.rewardSub, styles.itemReward]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                      {item.qty === 1 ? 'One coffee is free.' : '1 of ' + item.qty + ' coffees is free.'}
                      {cartTotals.discount < item.unitPrice ? ' Extras stay payable.' : ''}
                    </Text>
                  </View>
                ) : null}
                {isPrint && item.qty > 1 ? (
                  <Text style={styles.unitPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.qty} identical print jobs</Text>
                ) : null}
                <View style={[styles.itemBottom, isPrint && styles.printItemBottom]}>
                  {/* One remove action only (the x or the swipe): at quantity 1 the minus is a disabled minus */}
                  {!isPrint ? <QuantitySelector
                    small
                    allowRemove={false}
                    qty={item.qty}
                    increaseDisabled={Boolean(issue)}
                    onIncrease={() => changeQty(item.key, item.qty + 1)}
                    onDecrease={() => changeQty(item.key, item.qty - 1)}
                  /> : editOptions}
                  <View style={styles.linePrices}>
                    {rewarded ? (
                      <Text style={styles.originalPrice} maxFontSizeMultiplier={MAX_FONT_SCALE} accessibilityLabel={'Original price ' + formatMoney(lineTotal)}>
                        {formatMoney(lineTotal)}
                      </Text>
                    ) : null}
                    <AnimatedNumber value={lineTotal - (rewarded ? cartTotals.discount : 0)} format={formatMoney} style={styles.lineTotal} />
                  </View>
                </View>
                {!isPrint ? editOptions : null}
              </View>
            </View>
          </StaggerItem>
        </ReanimatedSwipeable>
      </Reanimated.View>
    );
  };

  const header = (
    <View style={styles.storeRow}>
      <LinearGradient colors={getCategoryColors(store?.category)} style={styles.storeIcon}>
        <Ionicons name={store ? getCategoryIcon(store.category) : 'storefront'} size={20} color={colors.textOnDark} />
      </LinearGradient>
      <View style={styles.storeInfo}>
        <Text style={styles.microLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Ordering from</Text>
        <Text style={styles.storeName} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store ? store.name : 'Store'}</Text>
        <Text style={styles.storeHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>One store per order</Text>
      </View>
      <PressableScale onPress={() => setConfirmClear(true)} hitSlop={8} style={styles.clearBtn} accessibilityLabel="Clear bag">
        <Text style={styles.clearText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Clear bag</Text>
      </PressableScale>
    </View>
  );

  const footer = (
    <View>
      <View style={styles.rewardCard}>
        <View style={styles.rewardHeading}>
          <Ionicons name="bicycle-outline" size={19} color={freeUnlocked ? colors.successText : colors.primaryText} />
          <Text style={styles.rewardTitle} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Free Delivery</Text>
        </View>
        <Text
          style={[styles.rewardItemName, freeUnlocked && styles.itemReward]}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          accessibilityLiveRegion="polite"
        >
          {freeUnlocked ? 'Free delivery applied automatically.' : 'Add ' + formatMoney(missingForFreeDelivery) + ' more for free delivery.'}
        </Text>
        {!freeUnlocked ? (
          <AnimatedProgressBar
            progress={1 - missingForFreeDelivery / (FREE_DELIVERY_OVER + 1)}
            color={colors.primary}
            trackColor={colors.surfaceMuted}
            style={styles.deliveryBar}
          />
        ) : null}
      </View>

      {rewardAvailable ? (
        <View style={styles.rewardCard}>
          <View style={styles.rewardHeading}>
            <Ionicons name="gift-outline" size={19} color={colors.primaryText} />
            <Text style={styles.rewardTitle} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Coffee Rewards</Text>
            <Text style={styles.rewardCount} maxFontSizeMultiplier={MAX_FONT_SCALE}>{loyalty.rewards} available</Text>
          </View>
          <Text style={styles.rewardSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>One free coffee per order.</Text>
          <View style={styles.rewardAction}>
            <View style={styles.rewardDetails}>
              <Text style={[styles.rewardItemName, rewardApplied && styles.itemReward]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {rewardApplied ? 'Free ' + rewardCoffee.item.name + ' applied' : 'Redeem a free ' + rewardCoffee.item.name}
              </Text>
              <Text style={styles.rewardSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {rewardApplied ? 'You save ' : 'Save '}{formatMoney(rewardCoffee.discount)}
              </Text>
            </View>
            <AppButton
              title={rewardApplied ? 'Remove' : 'Apply'}
              accessibilityLabel={rewardApplied ? 'Remove coffee reward' : 'Apply coffee reward'}
              variant={rewardApplied ? 'secondary' : 'primary'}
              small
              disabled={!rewardApplied && !storeOpen}
              onPress={() => {
                if (rewardApplied || isStoreOpen(store, timeOffsetMs)) setUseReward(!rewardApplied);
              }}
            />
          </View>
          {rewardApplied ? (
            <Text style={styles.rewardSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {remainingRewards} free {remainingRewards === 1 ? 'coffee' : 'coffees'} will remain after this order.
            </Text>
          ) : !storeOpen ? (
            <Text style={styles.rewardSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>Apply when Coffee Corner opens.</Text>
          ) : null}
        </View>
      ) : null}

      <PriceSummary title="Order summary" totals={cartTotals} showHints={false} compact style={styles.summary} />
    </View>
  );

  const blockReason = checkoutIssue();

  return (
    <View style={styles.screen}>
      {cart.items.length === 0 ? (
        <EmptyState
          icon="bag-handle-outline"
          iconSize={32}
          style={styles.emptyState}
          title="Your bag is empty"
          subtitle="Browse campus stores and add items or printing services to your bag."
          actionLabel="Browse stores"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <>
          <Reanimated.FlatList
            style={styles.scrollList}
            itemLayoutAnimation={reduceMotion ? undefined : LinearTransition}
            data={cart.items}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          <StickyBar insetBottom={false} style={styles.checkoutBar}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Total · {cartTotals.count} {cartTotals.count === 1 ? 'item' : 'items'}
              </Text>
              <AnimatedNumber value={cartTotals.total} format={formatMoney} style={styles.totalValue} />
            </View>
            <AppButton
              title="Proceed to checkout"
              small
              icon="arrow-forward-circle"
              disabled={Boolean(blockReason)}
              reason={blockReason}
              onPress={() => {
                const issue = checkoutIssue();
                if (!issue) navigation.navigate('Checkout');
                else setAvailabilityTick((tick) => tick + 1);
              }}
            />
          </StickyBar>
        </>
      )}

      <ConfirmModal
        visible={confirmClear && focused && cart.items.length > 0}
        title="Clear your bag?"
        message="All items in your bag will be removed."
        icon="trash"
        tone="danger"
        confirmLabel="Clear bag"
        onConfirm={() => {
          setConfirmClear(false);
          clearCart();
          showToast({ message: 'Your bag is empty', icon: 'bag-handle-outline' });
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </View>
  );
}
