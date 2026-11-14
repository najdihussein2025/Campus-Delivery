import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
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
import { FadeInView, PressableScale, useToast } from '../../components/motion';
import { colors, MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { isStoreOpen } from '../../utils/time';
import styles from './ProductDetailsScreen.styles';

// Product sheet (modal presentation): useState for options, SegmentedControl sizes, Switch extras, live total
export default function ProductDetailsScreen({ navigation, route }) {
  const { productId } = route.params;
  const { cart, getProduct, getStore, addToCart, replaceCart, timeOffsetMs } = useApp();
  const { showToast } = useToast();
  const product = getProduct(productId);
  const store = product ? getStore(product.storeId) : null;
  const sizes = product?.options?.sizes || [];
  const extras = product?.options?.extras || [];

  const [sizeLabel, setSizeLabel] = useState(sizes[0]?.label || null);
  const [chosenExtras, setChosenExtras] = useState([]);
  const [qty, setQty] = useState(1);
  const [conflictVisible, setConflictVisible] = useState(false);

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
  else if (!isOpen) blockReason = `${store.name} opens at ${store.openTime}`;

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
    };
  };

  // Feedback: toast with a "View" action, then close the sheet
  const confirmAdded = () => {
    showToast({
      message: `Added ${qty} × ${product.name} to bag`,
      icon: 'bag-check',
      tone: 'success',
      actionLabel: 'View',
      onAction: () => navigation.navigate('MainTabs', { screen: 'Cart' }),
    });
    navigation.goBack();
  };

  const handleAdd = () => {
    const result = addToCart(buildItem(), store.id);
    if (result === 'conflict') setConflictVisible(true);
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <ProductImage category={product.category} size={220} rounded={24} dimmed={!product.inStock} />
        </FadeInView>

        <FadeInView delay={60} style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.storeName} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {store.name} · {product.category}
            </Text>
            {!product.inStock ? <Badge variant="outOfStock" label="Out of stock" /> : null}
          </View>
          <Text style={styles.name} maxFontSizeMultiplier={MAX_FONT_SCALE}>{product.name}</Text>
          <Text style={styles.description} maxFontSizeMultiplier={MAX_FONT_SCALE}>{product.description}</Text>
          <Text style={styles.basePrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(product.price)}</Text>
        </FadeInView>

        {sizes.length > 0 ? (
          <FadeInView delay={120}>
            <SectionHeader title="Size" />
            <SegmentedControl
              options={sizes.map((s) => ({ value: s.label, label: s.label, subtitle: s.extra ? `+${formatMoney(s.extra)}` : 'Included' }))}
              value={sizeLabel}
              onChange={setSizeLabel}
            />
          </FadeInView>
        ) : null}

        {extras.length > 0 ? (
          <FadeInView delay={160}>
            <SectionHeader title="Extras" />
            <Card style={styles.extrasCard}>
              {extras.map((extra, index) => (
                <View key={extra.label} style={[styles.extraRow, index > 0 && styles.extraDivider]}>
                  <Text style={styles.extraLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{extra.label}</Text>
                  <Text style={styles.extraPrice} maxFontSizeMultiplier={MAX_FONT_SCALE}>+{formatMoney(extra.extra)}</Text>
                  <Switch
                    value={chosenExtras.includes(extra.label)}
                    onValueChange={() => toggleExtra(extra.label)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                    accessibilityLabel={`${extra.label}, plus ${formatMoney(extra.extra)}`}
                  />
                </View>
              ))}
            </Card>
          </FadeInView>
        ) : null}

        <FadeInView delay={200}>
          <SectionHeader title="Quantity" />
          <View style={styles.qtyRow}>
            <QuantitySelector qty={qty} onIncrease={() => setQty(qty + 1)} onDecrease={() => setQty(Math.max(1, qty - 1))} />
            <Text style={styles.unitText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(unitPrice)} each</Text>
          </View>
        </FadeInView>
      </ScrollView>

      <StickyBar>
        <AppButton
          title={`Add ${qty} to bag · ${formatMoney(total)}`}
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
