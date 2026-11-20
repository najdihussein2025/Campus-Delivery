import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, StatusBar, Text, View } from 'react-native';
import Reanimated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { getStoreLogo } from '../../data/images';
import Badge from '../../components/Badge';
import DietChip from '../../components/DietChip';
import MyDietChip from '../../components/MyDietChip';
import SeasonBanner from '../../components/SeasonBanner';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import { AnimatedNumber, BumpBadge, FlyTarget, PressableScale, useFlyToBag, useReduceMotion, useToast } from '../../components/motion';
import { fixedColors, getCategoryColors, MAX_FONT_SCALE, spacing } from '../../theme/theme';
import { durations } from '../../theme/motion';
import { formatMoney } from '../../utils/money';
import { closedReason, isStoreOpen, storeStatusLabel } from '../../utils/time';
import { matchesDiet } from '../../utils/diet';
import { createStyles, HERO_HEIGHT, TABS_HEIGHT } from './StoreMenuScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import useDietFilter from '../../hooks/useDietFilter';
import { useTheme } from '../../context/ThemeContext';

const HEADER_HEIGHT = HERO_HEIGHT + TABS_HEIGHT;
const TAB_PAD = spacing.md; // horizontal padding of a tab (styles.tab); the underline sits under the text only

// Store name in the navigation header: fades in as the hero scrolls away
function HeaderTitle({ title, scrollY, styles }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT * 0.45, HERO_HEIGHT * 0.8], [0, 1], Extrapolation.CLAMP),
  }));
  return <Reanimated.Text style={[styles.headerTitle, style]} numberOfLines={1}>{title}</Reanimated.Text>;
}

// Store menu: 200 px hero (stretches on overscroll, fades into the header while scrolling up), sticky category tabs
// with a sliding underline + scroll-spy, a Diet chip in the same sticky row, and a "View bag" bar.
export default function StoreMenuScreen({ navigation, route }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { storeId } = route.params;
  const { campus, cart, cartTotals, getStore, getStoreLocation, addToCart, timeOffsetMs, visibleSeasons, dismissSeason } = useApp();
  const reduceMotion = useReduceMotion();
  const { flyFrom } = useFlyToBag();
  const { showToast } = useToast();
  const focused = useIsFocused();
  const diet = useDietFilter({ useMyDiet: true });
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(null);
  const [tabWidths, setTabWidths] = useState({}); // measured width of each tab in the scrollable row
  const [tabsWidth, setTabsWidth] = useState(0); // visible width of the tab row (the Diet chip sits outside it)
  const tabScroll = useSharedValue(0); // horizontal scroll offset of the tab row
  const listRef = useRef(null);
  const tabsRef = useRef(null);
  const scrollY = useSharedValue(0);
  const indX = useSharedValue(0);
  const indW = useSharedValue(0);
  const barY = useRef(new Animated.Value(160)).current;
  const store = getStore(storeId);
  const isOpen = store ? isStoreOpen(store, timeOffsetMs) : false;
  const bagCount = cart.storeId === storeId ? cartTotals.count : 0;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const onTabsScroll = useAnimatedScrollHandler((e) => {
    tabScroll.value = e.contentOffset.x;
  });

  useEffect(() => {
    if (!store) return;
    navigation.setOptions({
      headerTitle: () => <HeaderTitle title={store.name} scrollY={scrollY} styles={styles} />,
      title: store.name,
      headerRight: () => (
        <FlyTarget active={focused}>
          <PressableScale
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
            hitSlop={10}
            style={styles.bagButton}
            accessibilityLabel={`Your bag, ${cartTotals.count} items`}
          >
            <Ionicons name="bag-handle-outline" size={24} color={colors.headerText} />
            <BumpBadge value={cartTotals.count} style={styles.bagBubble} />
          </PressableScale>
        </FlyTarget>
      ),
    });
  }, [cartTotals.count, store, focused, styles]);

  // Slide the "View bag" bar up when this store has items in the bag
  useEffect(() => {
    const toValue = bagCount > 0 ? 0 : 160;
    if (reduceMotion) barY.setValue(toValue);
    else Animated.spring(barY, { toValue, useNativeDriver: true, friction: 9 }).start();
  }, [bagCount > 0]);

  // Scroll-spy: the tab of the first visible category section is the active one
  // A tapped tab stays active while the list scrolls to it (the last sections can't reach the top, so scroll-spy would
  // otherwise switch back to an earlier one); scroll-spy takes over again on the next scroll by the user
  const tapLockUntil = useRef(0);
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (Date.now() < tapLockUntil.current) return;
    if (viewableItems.length) setActive(viewableItems[0].item.category);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const storeProducts = store ? campus.products.filter((p) => p.storeId === storeId) : [];
  const products = storeProducts.filter((p) => matchesDiet(p, diet.selected));
  // Sections with no matching product are hidden
  const categories = [...new Set(products.map((p) => p.category))];
  const groups = categories.map((c) => ({ category: c, products: products.filter((p) => p.category === c) }));
  const current = categories.includes(active) ? active : categories[0];

  // Position of each tab in the row's CONTENT coordinates (sum of the widths before it). The underline is drawn over the
  // row at (content x − row scroll offset), so it follows the tabs when the row scrolls; it slides to the active tab
  // (translateX + scaleX, UI thread) and is clipped to the row, so it never shows under the Diet chip.
  const allMeasured = categories.length > 0 && categories.every((c) => tabWidths[c]);
  const tabX = (category) => categories.slice(0, categories.indexOf(category)).reduce((sum, c) => sum + (tabWidths[c] || 0), 0);
  useEffect(() => {
    if (!allMeasured || !current) return;
    const x = tabX(current);
    const w = tabWidths[current];
    const textX = x + TAB_PAD;
    const textW = Math.max(1, w - TAB_PAD * 2);
    if (reduceMotion) {
      indX.value = textX;
      indW.value = textW;
    } else {
      indX.value = withTiming(textX, { duration: durations.medium });
      indW.value = withTiming(textW, { duration: durations.medium });
    }
    // Keep the active tab fully visible: centre it in the row (never behind the Diet chip, which is outside the row)
    if (tabsWidth) {
      const offset = Math.max(0, x - (tabsWidth - w) / 2);
      tabsRef.current?.scrollToOffset({ offset, animated: !reduceMotion });
    }
  }, [current, allMeasured, tabWidths, tabsWidth]);

  if (!store) {
    return <EmptyState icon="storefront-outline" title="Store not found" actionLabel="Go back" onAction={() => navigation.goBack()} />;
  }

  const jumpTo = (category) => {
    tapLockUntil.current = Date.now() + 900;
    setActive(category);
    const index = categories.indexOf(category);
    listRef.current?.scrollToIndex({ index, animated: !reduceMotion, viewOffset: TABS_HEIGHT + 8 });
  };

  // Quick add from the "+" of a product without options: add, then the thumbnail flies to the bag
  const quickAdd = (product, imageRef) => {
    const item = {
      key: `${product.id}||`,
      type: 'product',
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      qty: 1,
      details: '',
      category: product.category,
      loyalty: product.loyalty || null,
    };
    const result = addToCart(item, store.id);
    if (result === 'conflict') {
      navigation.navigate('ProductDetails', { productId: product.id }); // the sheet asks whether to empty the bag
      return;
    }
    if (result === 'closed') {
      showToast({ message: 'UA is closed – ordering is paused', icon: 'moon', tone: 'error' });
      return;
    }
    if (reduceMotion) showToast({ message: `Added ${product.name} to bag`, icon: 'bag-check', tone: 'success' });
    else flyFrom(imageRef, { category: product.category, productId: product.id });
  };

  // Hero: stretches on overscroll (scale from the top), fades out while scrolling up; the whole header scrolls up
  // until the tab strip is pinned under the navigation header
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -interpolate(scrollY.value, [0, HERO_HEIGHT], [0, HERO_HEIGHT], Extrapolation.CLAMP) }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.75], [1, 0], Extrapolation.CLAMP),
    transform: reduceMotion
      ? []
      : [{ scale: interpolate(scrollY.value, [-120, 0], [1.35, 1], Extrapolation.CLAMP) }],
    transformOrigin: 'center top',
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indX.value - tabScroll.value }, { scaleX: Math.max(indW.value, 1) / 100 }],
    transformOrigin: 'left center',
  }));

  const closedBanner = !isOpen ? (
    <View style={styles.closedBanner}>
      <Ionicons name="moon-outline" size={16} color={colors.dangerText} />
      <Text style={styles.closedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        Browsing only – {closedReason(store, campus.deliverySlots, timeOffsetMs)}
      </Text>
    </View>
  ) : null;

  const listHeader = (
    <View>
      {closedBanner}
      <SeasonBanner seasons={visibleSeasons} onSelectTag={diet.turnOn} onDismiss={dismissSeason} />
      {diet.showMyDiet ? <MyDietChip tags={diet.selected} onRemove={diet.clear} /> : null}
      {diet.selected.length > 0 ? (
        <Text style={styles.countLine} accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {products.length} {products.length === 1 ? 'item matches' : 'items match'}
        </Text>
      ) : null}
    </View>
  );

  const logo = getStoreLogo(store.id);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <Reanimated.FlatList
        ref={listRef}
        data={groups}
        keyExtractor={(item) => item.category}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title="Nothing matches these filters"
            subtitle="Try removing a filter to see more of the menu."
            actionLabel="Clear filters"
            onAction={diet.clear}
          />
        }
        contentContainerStyle={[styles.content, { paddingTop: HEADER_HEIGHT + 8, paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
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
                  onQuickAdd={quickAdd}
                />
              )}
            />
          </View>
        )}
      />

      <Reanimated.View style={[styles.header, headerStyle]}>
        <Reanimated.View style={[styles.heroWrap, heroStyle]}>
          {logo ? <Image source={logo} resizeMode="cover" style={styles.heroImage} accessibilityLabel={`${store.name} photo`} /> : null}
          <LinearGradient
            colors={logo ? ['rgba(12,38,64,0.25)', 'rgba(12,38,64,0.9)'] : getCategoryColors(store.category)}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={styles.hero}
          >
            {!logo ? <Ionicons name={store.icon} size={72} color="rgba(255,255,255,0.22)" style={styles.heroIcon} /> : null}
            <View style={styles.heroBottom}>
              <Text style={styles.heroName} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.name}</Text>
              <Text style={styles.heroDescription} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {store.description}
              </Text>
              <View style={styles.metaRow}>
                <Badge variant={isOpen ? 'open' : 'closed'} label={storeStatusLabel(store, timeOffsetMs)} />
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={14} color={fixedColors.white} />
                  <Text style={styles.metaText} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{getStoreLocation(store)}</Text>
                </View>
                <View style={styles.meta}>
                  <Ionicons name="flame-outline" size={14} color={fixedColors.white} />
                  <Text style={styles.metaText} maxFontSizeMultiplier={MAX_FONT_SCALE}>≈ {store.prepTime} min</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Reanimated.View>

        {/* One sticky row: category tabs (sliding underline) + the Diet chip */}
        <View style={styles.tabsBar}>
          <View style={styles.tabsClip} onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}>
          <Reanimated.FlatList
            ref={tabsRef}
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            extraData={current}
            onScroll={onTabsScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  setTabWidths((prev) => (prev[item] === width ? prev : { ...prev, [item]: width }));
                }}
              >
                <PressableScale
                  onPress={() => jumpTo(item)}
                  style={styles.tab}
                  accessibilityLabel={item}
                  accessibilityState={{ selected: current === item }}
                >
                  <Text style={[styles.tabText, current === item && styles.tabTextActive]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item}</Text>
                </PressableScale>
              </View>
            )}
          />
          <Reanimated.View pointerEvents="none" style={[styles.underline, indicatorStyle]} />
          </View>
          <DietChip selected={diet.selected} onToggle={diet.toggle} onClear={diet.clear} />
        </View>
      </Reanimated.View>

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
          <View style={styles.bagBarTextBox}>
            <Text style={styles.bagBarText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {bagCount} {bagCount === 1 ? 'item' : 'items'} · </Text>
            <AnimatedNumber value={cartTotals.subtotal} format={formatMoney} style={styles.bagBarText} />
          </View>
          <Text style={styles.bagBarAction} maxFontSizeMultiplier={MAX_FONT_SCALE}>View bag</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
        </PressableScale>
      </Animated.View>
    </View>
  );
}
