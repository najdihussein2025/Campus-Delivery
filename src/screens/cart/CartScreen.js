import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
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
import { AnimatedProgressBar, PressableScale, StaggerItem, animateLayout, useToast } from '../../components/motion';
import { colors, getCategoryColors, getCategoryIcon, MAX_FONT_SCALE } from '../../theme/theme';
import { FREE_DELIVERY_OVER, formatMoney } from '../../utils/money';
import { isStoreOpen } from '../../utils/time';
import * as haptics from '../../utils/haptics';
import styles from './CartScreen.styles';

// "Your bag": FlatList of items + useContext cart state + toast with Undo after removing
export default function CartScreen({ navigation }) {
  const { cart, cartTotals, getStore, changeQty, removeItem, restoreItem, clearCart, timeOffsetMs } = useApp();
  const { showToast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  const store = getStore(cart.storeId);
  const storeOpen = store ? isStoreOpen(store, timeOffsetMs) : false;
  const belowMinimum = cartTotals.missingForMinimum > 0;
  const freeUnlocked = cartTotals.subtotal > FREE_DELIVERY_OVER;

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
    animateLayout();
    removeItem(item.key);
    haptics.tap();
    showToast({
      message: `Removed ${item.name}`,
      icon: 'trash-outline',
      actionLabel: 'Undo',
      onAction: () => {
        animateLayout();
        restoreItem(item, index, storeId);
      },
    });
  };

  const renderItem = ({ item, index }) => (
    <StaggerItem index={index}>
      <View style={styles.itemCard}>
        <View style={styles.thumb}>
          <ProductImage category={item.category || (item.type === 'print' ? 'Printing' : null)} size={60} rounded={12} />
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
            <QuantitySelector
              small
              qty={item.qty}
              onIncrease={() => changeQty(item.key, item.qty + 1)}
              onDecrease={() => (item.qty <= 1 ? handleRemove(item) : changeQty(item.key, item.qty - 1))}
            />
            <Text style={styles.lineTotal} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(item.unitPrice * item.qty)}</Text>
          </View>
        </View>
      </View>
    </StaggerItem>
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
        <Text style={[styles.deliveryText, freeUnlocked && styles.deliveryTextDone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {freeUnlocked ? '🎉 Free delivery unlocked' : `Add ${formatMoney(cartTotals.missingForFreeDelivery)} more for free delivery`}
        </Text>
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

      <PriceSummary totals={cartTotals} showHints={false} style={styles.summary} />
    </View>
  );

  let blockReason = '';
  if (!storeOpen) blockReason = `${store ? store.name : 'This store'} is closed now — opens at ${store ? store.openTime : ''}`;
  else if (belowMinimum) blockReason = `Add ${formatMoney(cartTotals.missingForMinimum)} more to reach the $2.00 minimum`;

  return (
    <View style={styles.screen}>
      <FlatList
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
          <Text style={styles.totalValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(cartTotals.total)}</Text>
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
