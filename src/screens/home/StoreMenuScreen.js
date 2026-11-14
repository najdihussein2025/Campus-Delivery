import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import Badge from '../../components/Badge';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import { BumpBadge, PressableScale } from '../../components/motion';
import { colors, getCategoryColors, MAX_FONT_SCALE } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { isStoreOpen } from '../../utils/time';
import styles, { HERO_HEIGHT, CHIPS_HEIGHT } from './StoreMenuScreen.styles';

const HEADER_HEIGHT = HERO_HEIGHT + CHIPS_HEIGHT;

// Store menu: collapsing hero (Animated.event on scroll), sticky category chips and a "View bag" bar
export default function StoreMenuScreen({ navigation, route }) {
  const { storeId } = route.params;
  const { campus, cart, cartTotals, getStore, getStoreLocation, timeOffsetMs, reduceMotion } = useApp();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(null);
  const listRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const barY = useRef(new Animated.Value(160)).current;
  const store = getStore(storeId);
  const isOpen = store ? isStoreOpen(store, timeOffsetMs) : false;
  const bagCount = cart.storeId === storeId ? cartTotals.count : 0;

  useEffect(() => {
    if (!store) return;
    navigation.setOptions({
      title: store.name,
      headerRight: () => (
        <PressableScale
          onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          hitSlop={10}
          style={styles.bagButton}
          accessibilityLabel={`Your bag, ${cartTotals.count} items`}
        >
          <Ionicons name="bag-handle-outline" size={24} color={colors.textOnDark} />
          <BumpBadge value={cartTotals.count} style={styles.bagBubble} />
        </PressableScale>
      ),
    });
  }, [cartTotals.count, store]);

  // Slide the "View bag" bar up when this store has items in the bag
  useEffect(() => {
    const toValue = bagCount > 0 ? 0 : 160;
    if (reduceMotion) barY.setValue(toValue);
    else Animated.spring(barY, { toValue, useNativeDriver: true, friction: 9 }).start();
  }, [bagCount > 0]);

  // Highlight the chip of the first visible category section
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length) setActive(viewableItems[0].item.category);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  if (!store) {
    return <EmptyState icon="storefront-outline" title="Store not found" actionLabel="Go back" onAction={() => navigation.goBack()} />;
  }

  const products = campus.products.filter((p) => p.storeId === storeId);
  const categories = [...new Set(products.map((p) => p.category))];
  const groups = categories.map((c) => ({ category: c, products: products.filter((p) => p.category === c) }));
  const current = active || categories[0];

  const jumpTo = (category) => {
    setActive(category);
    const index = categories.indexOf(category);
    listRef.current?.scrollToIndex({ index, animated: !reduceMotion, viewOffset: CHIPS_HEIGHT + 8 });
  };

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [0, -HERO_HEIGHT],
    extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-80, 0],
    outputRange: [1.12, 1],
    extrapolate: 'clamp',
  });

  const closedBanner = !isOpen ? (
    <View style={styles.closedBanner}>
      <Ionicons name="moon-outline" size={16} color={colors.dangerText} />
      <Text style={styles.closedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        Browsing only – opens at {store.openTime}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Animated.FlatList
        ref={listRef}
        data={groups}
        keyExtractor={(item) => item.category}
        ListHeaderComponent={closedBanner}
        contentContainerStyle={[styles.content, { paddingTop: HEADER_HEIGHT + 8, paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={({ averageItemLength, index }) =>
          listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: true })
        }
        renderItem={({ item }) => (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.category}</Text>
              <Text style={styles.groupCount} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.products.length} items</Text>
            </View>
            <FlatList
              data={item.products}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={styles.productRow}
              renderItem={({ item: product, index }) => (
                <ProductCard
                  product={product}
                  index={index}
                  storeOpen={isOpen}
                  onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
                />
              )}
            />
          </View>
        )}
      />

      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslate }] }]}>
        <Animated.View style={[styles.heroWrap, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <View style={styles.heroRow}>
              <LinearGradient colors={getCategoryColors(store.category)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconTile}>
                <Ionicons name={store.icon} size={30} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.heroInfo}>
                <Text style={styles.heroDescription} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {store.description}
                </Text>
                <Badge variant={isOpen ? 'open' : 'closed'} label={isOpen ? `Open · until ${store.closeTime}` : `Closed · opens ${store.openTime}`} />
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={15} color={colors.accent} />
                <Text style={styles.metaText} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{getStoreLocation(store)}</Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={15} color={colors.accent} />
                <Text style={styles.metaText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.openTime}–{store.closeTime}</Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name="flame-outline" size={15} color={colors.accent} />
                <Text style={styles.metaText} maxFontSizeMultiplier={MAX_FONT_SCALE}>≈ {store.prepTime} min</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.chipsBar}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => <Chip label={item} selected={current === item} onPress={() => jumpTo(item)} />}
          />
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={bagCount > 0 ? 'auto' : 'none'}
        style={[styles.bagBar, { paddingBottom: Math.max(insets.bottom, 12), transform: [{ translateY: barY }] }]}
      >
        <PressableScale
          onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          style={styles.bagBarButton}
          haptic
          accessibilityLabel="View bag"
        >
          <View style={styles.bagBarCount}>
            <Text style={styles.bagBarCountText}>{bagCount}</Text>
          </View>
          <Text style={styles.bagBarText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {bagCount} {bagCount === 1 ? 'item' : 'items'} · {formatMoney(cartTotals.subtotal)}
          </Text>
          <Text style={styles.bagBarAction} maxFontSizeMultiplier={MAX_FONT_SCALE}>View bag</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
        </PressableScale>
      </Animated.View>
    </View>
  );
}
