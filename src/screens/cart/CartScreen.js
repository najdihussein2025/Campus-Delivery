import React, { useEffect, useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import Reanimated, { FadeOut, Extrapolation, LinearTransition, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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
import { AnimatedNumber, AnimatedProgressBar, ConfettiBurst, PressableScale, StaggerItem, animateLayout, useReduceMotion, useToast } from '../../components/motion';
import { springs, REDUCED_FADE_MS } from '../../theme/motion';
import { getCategoryColors, getCategoryIcon, MAX_FONT_SCALE } from '../../theme/theme';
import { FREE_DELIVERY_OVER, formatMoney } from '../../utils/money';
import { closedReason, isStoreOpen } from '../../utils/time';
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

// "Free delivery unlocked" line: springs up when the threshold is reached
function UnlockedText({ text, style }) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.8);
  useEffect(() => {
    if (!reduceMotion) scale.value = withSpring(1, springs.bouncy);
  }, []);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Reanimated.Text style={[style, animated]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{text}</Reanimated.Text>;
}

// "Your bag": FlatList of items + useContext cart state + toast with Undo after removing
export default function CartScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const {
    campus, cart, cartTotals, getStore, changeQty, removeItem, restoreItem, clearCart, timeOffsetMs,
    rewardAvailable, rewardApplied, useReward, setUseReward,
  } = useApp();
  const { showToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  const reduceMotion = useReduceMotion();
  const [confetti, setConfetti] = useState(0);
  const wasUnlocked = useRef(null);

  const store = getStore(cart.storeId);
  const storeOpen = store ? isStoreOpen(store, timeOffsetMs) : false;
  const belowMinimum = cartTotals.missingForMinimum > 0;
  const freeUnlocked = cartTotals.subtotal > FREE_DELIVERY_OVER;

  // Confetti once, when the free-delivery threshold is crossed while the bag is open (not on first render)
  useEffect(() => {
    if (wasUnlocked.current === false && freeUnlocked) setConfetti((n) => n + 1);
    wasUnlocked.current = freeUnlocked;
  }, [freeUnlocked]);

  if (cart.items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="bag-handle-outline"
          title="Your bag is empty"
          subtitle="Grab a coffee or a sandwich and we'll bring it to your class."
          actionLabel="Browse stores"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

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
        restoreItem(item, index, storeId);
      },
    });
  };

  const renderItem = ({ item, index }) => (
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
            <View style={styles.thumb}>
              <ProductImage category={item.category || (item.type === 'print' ? 'Printing' : null)} productId={item.productId} size={60} rounded={12} />
            </View>
            <View style={styles.itemInfo}>
              <View style={styles.itemTop}>
                <Text style={styles.itemName} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.name}</Text>
                <PressableScale
                  onPress={() => handleRemove(item)}
                  hitSlop={10}
                  style={styles.removeBtn}
                  accessibilityLabel={`Remove ${item.name}`}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </PressableScale>
              </View>
              {item.details ? <Text style={styles.itemDetails} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.details}</Text> : null}
              <Text style={styles.unitPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(item.unitPrice)} each</Text>
              <View style={styles.itemBottom}>
                {/* One remove action only (the x or the swipe): at quantity 1 the minus is a disabled minus */}
                <QuantitySelector
                  small
                  allowRemove={false}
                  qty={item.qty}
                  onIncrease={() => changeQty(item.key, item.qty + 1)}
                  onDecrease={() => changeQty(item.key, item.qty - 1)}
                />
                <AnimatedNumber value={item.unitPrice * item.qty} format={formatMoney} style={styles.lineTotal} />
              </View>
            </View>
          </View>
        </StaggerItem>
      </ReanimatedSwipeable>
    </Reanimated.View>
  );

  const header = (
    <View style={styles.storeRow}>
      <LinearGradient colors={getCategoryColors(store?.category)} style={styles.storeIcon}>
        <Ionicons name={store ? getCategoryIcon(store.category) : 'storefront'} size={20} color={colors.textOnDark} />
      </LinearGradient>
      <View style={styles.storeInfo}>
        <Text style={styles.microLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Ordering from</Text>
        <Text style={styles.storeName} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store ? store.name : 'Store'}</Text>
        <Text style={styles.storeHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>One store per order · clear the bag to change store</Text>
      </View>
      <PressableScale onPress={() => setConfirmClear(true)} hitSlop={8} style={styles.clearBtn} accessibilityLabel="Clear bag">
        <Text style={styles.clearText}>Clear</Text>
      </PressableScale>
    </View>
  );

  const footer = (
    <View>
      <View style={[styles.deliveryCard, freeUnlocked && styles.deliveryCardDone]}>
        {freeUnlocked ? (
          <UnlockedText text="🎉 Free delivery unlocked" style={[styles.deliveryText, styles.deliveryTextDone]} />
        ) : (
          <Text style={styles.deliveryText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {`Free delivery on orders over ${formatMoney(FREE_DELIVERY_OVER)} · you're ${formatMoney(FREE_DELIVERY_OVER - cartTotals.subtotal)} away`}
          </Text>
        )}
        <ConfettiBurst trigger={confetti} />
        <AnimatedProgressBar
          progress={Math.min(1, cartTotals.subtotal / (FREE_DELIVERY_OVER + 1))}
          color={freeUnlocked ? colors.success : colors.accent}
          trackColor={colors.surfaceMuted}
          style={styles.deliveryBar}
        />
      </View>

      {belowMinimum ? (
        <View style={styles.warningCard}>
          <Ionicons name="alert-circle" size={20} color={colors.warningText} />
          <Text style={styles.warningText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Minimum order is $2.00. Add {formatMoney(cartTotals.missingForMinimum)} more to check out.
          </Text>
        </View>
      ) : null}

      {rewardAvailable ? (
        <View style={styles.rewardCard}>
          <Text style={styles.rewardEmoji}>🎁</Text>
          <View style={styles.rewardText}>
            <Text style={styles.rewardTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Use my free coffee</Text>
            <Text style={styles.rewardSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {rewardApplied
                ? 'Free coffee applied. Minimum order counts what you pay.'
                : 'Your most expensive coffee in the bag is on us.'}
            </Text>
          </View>
          <Switch
            value={useReward}
            onValueChange={(value) => {
              animateLayout();
              haptics.tap();
              setUseReward(value);
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessibilityLabel="Use my free coffee"
          />
        </View>
      ) : null}

      <PriceSummary totals={cartTotals} showHints={false} style={styles.summary} />
    </View>
  );

  let blockReason = '';
  if (!storeOpen) blockReason = closedReason(store, campus.deliverySlots, timeOffsetMs);
  else if (belowMinimum) blockReason = `Add ${formatMoney(cartTotals.missingForMinimum)} more to reach the $2.00 minimum`;

  return (
    <View style={styles.screen}>
      <Reanimated.FlatList
        itemLayoutAnimation={reduceMotion ? undefined : LinearTransition}
        data={cart.items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <StickyBar>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Total · {cartTotals.count} {cartTotals.count === 1 ? 'item' : 'items'}
          </Text>
          <AnimatedNumber value={cartTotals.total} format={formatMoney} style={styles.totalValue} />
        </View>
        <AppButton
          title="Checkout"
          icon="arrow-forward-circle"
          disabled={Boolean(blockReason)}
          reason={blockReason}
          onPress={() => navigation.navigate('Checkout')}
        />
      </StickyBar>

      <ConfirmModal
        visible={confirmClear}
        title="Clear your bag?"
        message="All items will be removed from your bag."
        icon="trash"
        tone="danger"
        confirmLabel="Clear"
        onConfirm={() => {
          animateLayout();
          clearCart();
          setConfirmClear(false);
          showToast({ message: 'Your bag is empty', icon: 'bag-handle-outline' });
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </View>
  );
}
