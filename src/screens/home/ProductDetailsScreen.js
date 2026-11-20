import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, Switch, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import QuantitySelector from '../../components/QuantitySelector';
import SectionHeader from '../../components/SectionHeader';
import SegmentedControl from '../../components/SegmentedControl';
import StickyBar from '../../components/StickyBar';
import { AnimatedNumber, FadeInView, PressableScale, useFlyToBag, useReduceMotion, useToast } from '../../components/motion';
import { durations, easings, springs, REDUCED_FADE_MS } from '../../theme/motion';
import * as haptics from '../../utils/haptics';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { closedReason, isStoreOpen } from '../../utils/time';
import { allergenLine, tagMeta } from '../../utils/diet';
import { createStyles } from './ProductDetailsScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

// Product image: enters with a slight zoom (1.08 → 1) and a fade; Reduce Motion: fade only
function ZoomImage({ children }) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: reduceMotion ? REDUCED_FADE_MS : durations.long, easing: easings.emphasizedDecel });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: reduceMotion ? [] : [{ scale: 1.08 - 0.08 * progress.value }],
  }));
  return <Reanimated.View style={style}>{children}</Reanimated.View>;
}

// Product sheet (modal presentation): useState for options, SegmentedControl sizes, Switch extras, live total
export default function ProductDetailsScreen({ navigation, route }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { productId } = route.params;
  const { campus, cart, getProduct, getStore, addToCart, replaceCart, timeOffsetMs } = useApp();
  const { showToast } = useToast();
  const product = getProduct(productId);
  const store = product ? getStore(product.storeId) : null;
  const sizes = product?.options?.sizes || [];
  const extras = product?.options?.extras || [];

  const [sizeLabel, setSizeLabel] = useState(sizes[0]?.label || null);
  const [chosenExtras, setChosenExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [conflictVisible, setConflictVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const [barHeight, setBarHeight] = useState(150);
  const imageRef = useRef(null);
  const reduceMotion = useReduceMotion();
  const { fly } = useFlyToBag();
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  if (!product || !store) {
    return <EmptyState icon="cube-outline" title="Product not found" actionLabel="Go back" onAction={() => navigation.goBack()} />;
  }

  const size = sizes.find((s) => s.label === sizeLabel) || null;
  const isOpen = isStoreOpen(store, timeOffsetMs);
  const unitPrice =
    product.price + (size ? size.extra : 0) + chosenExtras.reduce((sum, label) => sum + extras.find((e) => e.label === label).extra, 0);
  const total = unitPrice * qty;

  let blockReason = '';
  if (!product.inStock) blockReason = 'This item is out of stock right now.';
  else if (!isOpen) blockReason = closedReason(store, campus.deliverySlots, timeOffsetMs);

  const toggleExtra = (label) => {
    setChosenExtras((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const buildItem = () => {
    const sortedExtras = [...chosenExtras].sort();
    const details = [size ? size.label : null, ...sortedExtras].filter(Boolean).join(' · ');
    return {
      key: `${product.id}|${size ? size.label : ''}|${sortedExtras.join(',')}`,
      type: 'product',
      productId: product.id,
      name: product.name,
      unitPrice,
      qty,
      details,
      category: product.category,
      loyalty: product.loyalty || null,
    };
  };

  // Success: the button morphs to "✓ Added", the thumbnail position is measured, the sheet closes and the thumbnail
  // flies to the bag (fly-to-bag). Reduce Motion: no flight, just the toast.
  const confirmAdded = () => {
    setAdded(true);
    haptics.success();
    if (!reduceMotion) {
      pop.value = 0.94;
      pop.value = withSpring(1, springs.bouncy);
    }
    const finish = (from) => {
      showToast({
        message: `Added ${qty} × ${product.name} to bag`,
        icon: 'bag-check',
        tone: 'success',
        actionLabel: 'View',
        onAction: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
      });
      navigation.goBack();
      if (from) fly({ from, category: product.category, productId: product.id });
    };
    const node = imageRef.current;
    if (reduceMotion || !node || !node.measureInWindow) {
      setTimeout(() => finish(null), reduceMotion ? 0 : 350);
      return;
    }
    node.measureInWindow((x, y, w, h) => setTimeout(() => finish({ x: x + w / 2, y: y + h / 2 }), 380));
  };

  const handleAdd = () => {
    if (added) return;
    const result = addToCart(buildItem(), store.id);
    if (result === 'conflict') setConflictVisible(true);
    else if (result === 'closed') showToast({ message: 'UA is closed – ordering is paused', icon: 'moon', tone: 'error' });
    else confirmAdded();
  };

  const handleReplace = () => {
    replaceCart(buildItem(), store.id);
    setConflictVisible(false);
    confirmAdded();
  };

  const cartStoreName = getStore(cart.storeId)?.name || 'another store';

  return (
    <View style={styles.screen}>
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>
      <PressableScale onPress={() => navigation.goBack()} style={styles.closeButton} accessibilityLabel="Close" hitSlop={8}>
        <Ionicons name="close" size={22} color={colors.text} />
      </PressableScale>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: barHeight + 24 }]} showsVerticalScrollIndicator={false}>
        <ZoomImage>
          <View ref={imageRef} collapsable={false}>
            <ProductImage category={product.category} productId={product.id} size={220} rounded={24} dimmed={!product.inStock} />
          </View>
        </ZoomImage>

        <FadeInView delay={60} style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.storeName} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {store.name} · {product.category}
            </Text>
            {!product.inStock ? <Badge variant="outOfStock" label="Out of stock" /> : null}
          </View>
          <Text style={styles.name} maxFontSizeMultiplier={MAX_FONT_SCALE}>{product.name}</Text>
          {product.tags && product.tags.length > 0 ? (
            <FlatList
              data={product.tags}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(tag) => tag}
              style={styles.tagRow}
              renderItem={({ item: tag }) => (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {tagMeta(tag) ? `${tagMeta(tag).emoji} ${tagMeta(tag).label}` : tag}
                  </Text>
                </View>
              )}
            />
          ) : null}
          <Text style={styles.description} maxFontSizeMultiplier={MAX_FONT_SCALE}>{product.description}</Text>
          {allergenLine(product) ? (
            <Text style={styles.allergens} maxFontSizeMultiplier={MAX_FONT_SCALE}>{allergenLine(product)}</Text>
          ) : null}
          <AnimatedNumber value={unitPrice} format={formatMoney} style={styles.basePrice} />
        </FadeInView>

        {sizes.length > 0 ? (
          <FadeInView delay={120}>
            <SectionHeader title="Size" />
            <SegmentedControl
              options={sizes.map((s) => ({ value: s.label, label: s.label, subtitle: s.extra ? `+${formatMoney(s.extra)}` : 'Included' }))}
              value={sizeLabel}
              onChange={setSizeLabel}
              disabled={!product.inStock}
            />
          </FadeInView>
        ) : null}

        {extras.length > 0 ? (
          <FadeInView delay={160}>
            <SectionHeader title="Extras" />
            <Card style={styles.extrasCard}>
              <FlatList
                data={extras}
                scrollEnabled={false}
                keyExtractor={(extra) => extra.label}
                extraData={chosenExtras}
                renderItem={({ item: extra, index }) => (
                <View style={[styles.extraRow, index > 0 && styles.extraDivider, !product.inStock && styles.extraRowOff]}>
                  <Text style={styles.extraLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{extra.label}</Text>
                  <Text style={styles.extraPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>+{formatMoney(extra.extra)}</Text>
                  <Switch
                    value={chosenExtras.includes(extra.label)}
                    onValueChange={() => toggleExtra(extra.label)}
                    disabled={!product.inStock}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                    accessibilityLabel={`${extra.label}, plus ${formatMoney(extra.extra)}`}
                  />
                </View>
                )}
              />
            </Card>
          </FadeInView>
        ) : null}

        <FadeInView delay={200}>
          <SectionHeader title="Quantity" />
          <View style={styles.qtyRow}>
            <QuantitySelector
              qty={qty}
              allowRemove={false}
              disabled={!product.inStock}
              onIncrease={() => setQty(qty + 1)}
              onDecrease={() => setQty(Math.max(1, qty - 1))}
            />
            <Text style={styles.unitText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(unitPrice)} each · total {formatMoney(total)}</Text>
          </View>
        </FadeInView>
      </ScrollView>

      <StickyBar onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}>
        <Reanimated.View style={popStyle}>
          <AppButton
            title={added ? '✓ Added' : `Add ${qty} to bag · ${formatMoney(total)}`}
            icon={added ? undefined : 'bag-add-outline'}
            onPress={handleAdd}
            disabled={!!blockReason}
            reason={blockReason}
          />
        </Reanimated.View>
      </StickyBar>

      <ConfirmModal
        visible={conflictVisible}
        tone="warning"
        icon="swap-horizontal"
        title="Start a new bag?"
        message={`Your bag has items from ${cartStoreName}. Empty it and add this item?`}
        confirmLabel="Empty & add"
        onConfirm={handleReplace}
        onCancel={() => setConflictVisible(false)}
      />
    </View>
  );
}
