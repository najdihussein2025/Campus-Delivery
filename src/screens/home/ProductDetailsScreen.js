import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, Switch, Text, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
import { AnimatedNumber, FadeInView, PressableScale, useReduceMotion, useToast } from '../../components/motion';
import { durations, easings, REDUCED_FADE_MS } from '../../theme/motion';
import * as haptics from '../../utils/haptics';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { closedReason, isStoreOpen } from '../../utils/time';
import { allergenLine, customizedDietTags, getDietMatch, matchesDrinkDiet, STORE_DIET_OPTIONS, tagMeta } from '../../utils/diet';
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
  const { productId, drinkFilters = [], editKey, bagFeedbackScope } = route.params;
  const { campus, cart, getProduct, getStore, addToCart, replaceCart, updateCartItem, timeOffsetMs, loyalty } = useApp();
  const { showToast, showBagAddition } = useToast();
  const product = getProduct(productId);
  const editingItem = editKey ? cart.items.find((item) => item.key === editKey && item.productId === productId) : null;
  const store = product ? getStore(product.storeId) : null;
  const isBookstore = product?.storeId === 'bookstore';
  const variants = (isBookstore ? product?.options?.coverColors : product?.options?.sizes) || [];
  const extras = isBookstore ? [] : product?.options?.extras || [];
  const isCoffee = product?.storeId === 'coffee';
  const isCafeteria = product?.storeId === 'cafeteria';
  const showMockDetails = isCafeteria || isCoffee;
  const useFixedActions = showMockDetails || isBookstore;
  const filters = isCoffee ? drinkFilters : [];

  const [, savedVariant, savedExtras] = editingItem?.key.split('|') || [];
  const [variantLabel, setVariantLabel] = useState(() => {
    const label = editingItem?.configuration?.variant?.label || savedVariant;
    return variants.find((option) => option.label === label)?.label || variants[0]?.label || null;
  });
  const [chosenExtras, setChosenExtras] = useState(() => {
    if (editingItem) {
      const labels = editingItem.configuration?.extras?.map(({ label }) => label) || savedExtras?.split(',') || [];
      return extras.filter(({ label }) => labels.includes(label)).map(({ label }) => label);
    }
    const match = isCoffee ? getDietMatch(product, filters) : null;
    return match?.extra ? [match.extra.label] : [];
  });
  const [qty, setQty] = useState(1);
  const [conflictVisible, setConflictVisible] = useState(false);
  const submitted = useRef(false);
  const [barHeight, setBarHeight] = useState(150);

  if (!product || !store) {
    return <EmptyState icon="cube-outline" title="Product not found" actionLabel="Go back" onAction={() => navigation.goBack()} />;
  }
  if (editKey && !editingItem) {
    return <EmptyState icon="bag-handle-outline" title="This item is no longer in your bag" actionLabel="Go back" onAction={() => navigation.goBack()} />;
  }

  const variant = variants.find((option) => option.label === variantLabel) || null;
  const selectedExtras = extras.filter(({ label }) => chosenExtras.includes(label));
  const configuredTags = customizedDietTags(product, selectedExtras);
  const tags = showMockDetails
    ? STORE_DIET_OPTIONS[product.storeId].filter(({ id }) => configuredTags.includes(id)).map(({ id }) => id)
    : isBookstore ? [] : configuredTags;
  const specifications = isBookstore ? Object.entries(product.specifications || {}) : [];
  const replacesDairy = selectedExtras.some((extra) => extra.replacesDairy);
  const baseAllergens = (product.allergens || []).filter((allergen) => !replacesDairy || allergen !== 'dairy');
  const mockAllergens = [...new Set([...baseAllergens, ...selectedExtras.flatMap((extra) => extra.allergens || [])])];
  const allergens = isBookstore ? '' : allergenLine(product);
  const isOpen = isStoreOpen(store, timeOffsetMs);
  const unitPrice =
    product.price + (variant?.extra ?? 0) + selectedExtras.reduce((sum, extra) => sum + extra.extra, 0);
  const quantity = editingItem?.qty ?? qty;
  const total = unitPrice * quantity;
  const protein = isCafeteria ? product.nutrition?.estimatedProteinGrams : null;

  let blockReason = '';
  if (!product.inStock) blockReason = 'This item is out of stock right now.';
  else if (!isOpen && !editingItem) blockReason = closedReason(store, campus.deliverySlots, timeOffsetMs);
  else if (filters.length > 0 && !matchesDrinkDiet(product, filters, selectedExtras)) {
    blockReason = 'Choose options that match your dietary filters.';
  }

  const extrasAfterToggle = (label) => extras.filter((extra) =>
    extra.label === label ? !chosenExtras.includes(label) : chosenExtras.includes(extra.label)
  );
  const toggleExtra = (label) => {
    setChosenExtras((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  const buildItem = () => {
    const sortedExtras = [...chosenExtras].sort();
    const details = [variant?.label, ...sortedExtras].filter(Boolean).join(' · ');
    return {
      key: `${product.id}|${variant?.label ?? ''}|${sortedExtras.join(',')}`,
      type: 'product',
      productId: product.id,
      name: product.name,
      unitPrice,
      qty: quantity,
      details,
      configuration: {
        variant: variant ? { label: variant.label, extra: variant.extra } : null,
        extras: selectedExtras.map(({ label, extra }) => ({ label, extra })),
      },
      category: product.category,
      loyalty: product.loyalty || null,
    };
  };

  const confirmAdded = () => {
    submitted.current = true;
    haptics.success();
    showBagAddition({ scope: bagFeedbackScope, name: product.name, quantity });
    navigation.goBack();
  };

  const canAdd = () => {
    if (submitted.current || blockReason) return false;
    if (!editingItem && useFixedActions && !isStoreOpen(store, timeOffsetMs)) {
      showToast({ message: closedReason(store, campus.deliverySlots, timeOffsetMs), icon: 'moon', tone: 'error' });
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!canAdd()) return;
    if (editingItem) {
      if (updateCartItem(editKey, buildItem())) {
        showToast({ message: 'Bag item updated', icon: 'bag-check', tone: 'success' });
        navigation.goBack();
      } else {
        showToast({ message: 'Could not update this bag item', icon: 'alert-circle', tone: 'error' });
      }
      return;
    }
    const result = addToCart(buildItem(), store.id);
    if (result === 'conflict') setConflictVisible(true);
    else if (result === 'closed') showToast({ message: 'UA is closed – ordering is paused', icon: 'moon', tone: 'error' });
    else confirmAdded();
  };

  const handleReplace = () => {
    if (useFixedActions && !canAdd()) {
      setConflictVisible(false);
      return;
    }
    const result = replaceCart(buildItem(), store.id);
    setConflictVisible(false);
    if (result === 'closed') showToast({ message: 'Ordering is paused', icon: 'moon', tone: 'error' });
    else confirmAdded();
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

      <ScrollView
        style={useFixedActions ? styles.detailsScroll : undefined}
        contentContainerStyle={[styles.content, { paddingBottom: useFixedActions ? 24 : barHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <ZoomImage>
          <View>
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
          {tags.length > 0 ? (
            <FlatList
              data={tags}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(tag) => tag}
              style={styles.tagRow}
              renderItem={({ item: tag }) => (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {STORE_DIET_OPTIONS[product.storeId]?.find(({ id }) => id === tag)?.label
                      || (tagMeta(tag) ? `${tagMeta(tag).emoji} ${tagMeta(tag).label}` : tag)}
                  </Text>
                </View>
              )}
            />
          ) : null}
          <Text style={styles.description} maxFontSizeMultiplier={MAX_FONT_SCALE}>{product.description}</Text>
          {showMockDetails ? (
            <Text style={styles.allergens} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {mockAllergens.length > 0
                ? `Mock recipe allergens: ${mockAllergens.join(', ')}.`
                : 'Allergen information is unspecified for this mock recipe.'}
            </Text>
          ) : allergens ? (
            <Text style={styles.allergens} maxFontSizeMultiplier={MAX_FONT_SCALE}>{allergens}</Text>
          ) : null}
          {protein != null ? (
            <Text style={styles.allergens} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Estimated protein: {protein} g per base serving.
            </Text>
          ) : null}
          {specifications.length > 0 ? (
            <View style={styles.specifications}>
              <Text style={styles.specTitle} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Mock specifications
              </Text>
              <FlatList
                data={specifications}
                keyExtractor={([label]) => label}
                scrollEnabled={false}
                initialNumToRender={specifications.length}
                renderItem={({ item: [label, value] }) => (
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
                    <Text style={styles.specValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
                  </View>
                )}
              />
            </View>
          ) : null}
          {isCoffee && product.loyalty === 'coffee' ? (
            <Text style={styles.rewardNote} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              <Ionicons name="gift-outline" size={15} color={colors.primaryText} /> Eligible for coffee rewards
              {loyalty.rewards > 0 ? '. Redeem in the Bag.' : ''}
            </Text>
          ) : null}
          <AnimatedNumber value={unitPrice} format={formatMoney} style={styles.basePrice} />
        </FadeInView>

        {variants.length > 0 ? (
          <FadeInView delay={120}>
            <SectionHeader title={isBookstore ? 'Cover color' : 'Size'} />
            <SegmentedControl
              options={variants.map(({ label, extra }) => ({
                value: label,
                label,
                subtitle: extra ? `+${formatMoney(extra)}` : isBookstore ? undefined : 'Included',
              }))}
              value={variantLabel}
              onChange={setVariantLabel}
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
                  <Text style={styles.extraLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {extra.replacesDairy ? `${extra.label} substitution` : extra.label}
                  </Text>
                  <Text style={styles.extraPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>+{formatMoney(extra.extra)}</Text>
                  <Switch
                    value={chosenExtras.includes(extra.label)}
                    onValueChange={() => toggleExtra(extra.label)}
                    disabled={!product.inStock || (filters.length > 0 && !matchesDrinkDiet(product, filters, extrasAfterToggle(extra.label)))}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                    accessibilityLabel={`${extra.label}${extra.replacesDairy ? ' substitution' : ''}, plus ${formatMoney(extra.extra)}`}
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
            {editingItem ? (
              <Text style={styles.unitText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{quantity} in your bag</Text>
            ) : <QuantitySelector
              qty={qty}
              allowRemove={false}
              disabled={!product.inStock}
              onIncrease={() => setQty(qty + 1)}
              onDecrease={() => setQty(Math.max(1, qty - 1))}
            />}
            <Text style={styles.unitText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(unitPrice)} each · total {formatMoney(total)}</Text>
          </View>
        </FadeInView>
      </ScrollView>

      <StickyBar
        style={useFixedActions ? styles.detailsActions : undefined}
        onLayout={useFixedActions ? undefined : (e) => setBarHeight(e.nativeEvent.layout.height)}
      >
        <AppButton
          title={editingItem ? `Save options · ${formatMoney(total)}` : `Add ${qty} to bag · ${formatMoney(total)}`}
          icon="bag-add-outline"
          onPress={handleAdd}
          disabled={!!blockReason}
          reason={blockReason}
        />
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
