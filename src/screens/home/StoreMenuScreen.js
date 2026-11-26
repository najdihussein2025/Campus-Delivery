import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, StatusBar, Text, View } from 'react-native';
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
import AppInput from '../../components/AppInput';
import Chip from '../../components/Chip';
import WrappedFlatList from '../../components/WrappedFlatList';
import LoyaltyCard from '../../components/LoyaltyCard';
import DietChip from '../../components/DietChip';
import MyDietChip from '../../components/MyDietChip';
import SeasonBanner from '../../components/SeasonBanner';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import BagAdditionNotice from '../../components/BagAdditionNotice';
import { BumpBadge, FlyTarget, PressableScale, useReduceMotion, useToast } from '../../components/motion';
import { fixedColors, getCategoryColors, MAX_FONT_SCALE, spacing } from '../../theme/theme';
import { durations } from '../../theme/motion';
import { closedReason, isStoreOpen, storeStatusLabel } from '../../utils/time';
import { getDietMatch, matchesDiet, STORE_DIET_OPTIONS } from '../../utils/diet';
import { COMPACT_HERO_HEIGHT, createStyles, HERO_HEIGHT, TABS_HEIGHT } from './StoreMenuScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import useDietFilter from '../../hooks/useDietFilter';
import { useTheme } from '../../context/ThemeContext';

const TAB_PAD = spacing.md; // horizontal padding of a tab (styles.tab); the underline sits under the text only

// Store name in the navigation header: fades in as the hero scrolls away
function HeaderTitle({ title, scrollY, styles }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO_HEIGHT * 0.45, HERO_HEIGHT * 0.8], [0, 1], Extrapolation.CLAMP),
  }));
  return <Reanimated.Text style={[styles.headerTitle, style]} numberOfLines={1}>{title}</Reanimated.Text>;
}

// Store menu: 200 px hero (stretches on overscroll, fades into the header while scrolling up), sticky category tabs
// with a sliding underline + scroll-spy, dietary controls, and the Bag badge.
export default function StoreMenuScreen({ navigation, route }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { storeId } = route.params;
  const isCoffee = storeId === 'coffee';
  const dietaryOptions = STORE_DIET_OPTIONS[storeId];
  const hasDietaryFilterSheet = Boolean(dietaryOptions);
  const isBookstore = storeId === 'bookstore';
  const hasMenuSearch = hasDietaryFilterSheet || isBookstore;
  const allowedTags = dietaryOptions?.map(({ id }) => id);
  const {
    campus, cartTotals, getStore, getStoreLocation, addToCart, timeOffsetMs, visibleSeasons, dismissSeason,
    loyalty,
  } = useApp();
  const reduceMotion = useReduceMotion();
  const { showToast, showBagAddition } = useToast();
  const focused = useIsFocused();
  const diet = useDietFilter({ useMyDiet: !isBookstore, allowedTags });
  const selectedFilters = isBookstore ? [] : diet.selected.filter((tag) => !allowedTags || allowedTags.includes(tag));
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [, setAvailabilityTick] = useState(0);
  const [active, setActive] = useState(null);
  const [menuControlsHeight, setMenuControlsHeight] = useState(0);
  const heroHeight = hasMenuSearch ? COMPACT_HERO_HEIGHT : HERO_HEIGHT;
  const pinnedHeight = TABS_HEIGHT + (hasMenuSearch ? menuControlsHeight : 0);
  const [tabWidths, setTabWidths] = useState({}); // measured width of each tab in the scrollable row
  const [tabsWidth, setTabsWidth] = useState(0); // visible width of the tab row (the Diet chip sits outside it)
  const tabScroll = useSharedValue(0); // horizontal scroll offset of the tab row
  const listRef = useRef(null);
  const tapLockUntil = useRef(0);
  const tabsRef = useRef(null);
  const scrollY = useSharedValue(0);
  const indX = useSharedValue(0);
  const indW = useSharedValue(0);
  const store = getStore(storeId);
  const isOpen = store ? isStoreOpen(store, timeOffsetMs) : false;
  const query = hasMenuSearch ? search.trim().toLowerCase() : '';
  const filterKey = selectedFilters.join(',');

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const onTabsScroll = useAnimatedScrollHandler((e) => {
    tabScroll.value = e.contentOffset.x;
  });

  useEffect(() => {
    if (!store) return;
    navigation.setOptions({
      ...(!isBookstore && {
        headerTitle: hasMenuSearch ? store.name : () => <HeaderTitle title={store.name} scrollY={scrollY} styles={styles} />,
      }),
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
  }, [cartTotals.count, store, focused, styles, hasMenuSearch, isBookstore]);

  useEffect(() => {
    if (!hasMenuSearch || !focused) return;
    const timer = setInterval(() => setAvailabilityTick((tick) => tick + 1), 10000);
    return () => clearInterval(timer);
  }, [hasMenuSearch, focused]);

  useEffect(() => {
    if (!hasMenuSearch) return;
    tapLockUntil.current = 0;
    setActive(null);
    const offset = Math.max(0, Math.min(scrollY.value, heroHeight));
    listRef.current?.scrollToOffset({ offset, animated: false });
  }, [hasMenuSearch, query, filterKey, heroHeight, scrollY]);

  // Scroll-spy: the tab of the first visible category section is the active one
  // A tapped tab stays active while the list scrolls to it (the last sections can't reach the top, so scroll-spy would
  // otherwise switch back to an earlier one); scroll-spy takes over again on the next scroll by the user
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (Date.now() < tapLockUntil.current) return;
    if (viewableItems.length) setActive(viewableItems[0].item.category);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const storeProducts = store ? campus.products.filter((p) => p.storeId === storeId) : [];
  const matches = new Map();
  const products = storeProducts.filter((product) => {
    if (query && !product.name.toLowerCase().includes(query)) return false;
    if (storeId === 'cafeteria') return matchesDiet(product, selectedFilters);
    if (!hasDietaryFilterSheet) return matchesDiet(product, selectedFilters);
    const match = getDietMatch(product, selectedFilters);
    if (!match) return false;
    matches.set(product.id, match);
    return true;
  });
  const reserveOptionSpace = isCoffee && [...matches.values()].some((match) => match.extra);
  const menuSeasons = isBookstore ? [] : visibleSeasons.filter((season) => !allowedTags || allowedTags.includes(season.highlightTag));
  // Sections with no matching product are hidden
  const categories = [...new Set(products.map((p) => p.category))];
  const groups = categories.map((c) => ({ category: c, products: products.filter((p) => p.category === c) }));
  const current = categories.includes(active) ? active : categories[0];

  // Position of each tab in the row's CONTENT coordinates (sum of the widths before it). The underline is drawn over the
  // row at (content x − row scroll offset), so it follows the tabs when the row scrolls; it slides to the active tab
  // (translateX + scaleX, UI thread) and is clipped to the row, so it never shows under the Diet chip.
  const allMeasured = categories.length > 0 && categories.every((c) => tabWidths[c]);
  const currentTabX = categories.slice(0, categories.indexOf(current)).reduce((sum, c) => sum + (tabWidths[c] || 0), 0);
  useEffect(() => {
    if (!allMeasured || !current) return;
    const x = currentTabX;
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
  }, [current, currentTabX, allMeasured, tabWidths, tabsWidth, reduceMotion]);

  const jumpTo = (category) => {
    tapLockUntil.current = Date.now() + 900;
    setActive(category);
    const index = categories.indexOf(category);
    listRef.current?.scrollToIndex({ index, animated: !reduceMotion, viewOffset: pinnedHeight + 8 });
  };

  // Products without options can be added directly from the menu.
  const quickAdd = (product) => {
    if (hasMenuSearch && !isStoreOpen(store, timeOffsetMs)) {
      setAvailabilityTick((tick) => tick + 1);
      showToast({ message: closedReason(store, campus.deliverySlots, timeOffsetMs), icon: 'moon', tone: 'error' });
      return;
    }
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
      navigation.navigate('ProductDetails', { productId: product.id, bagFeedbackScope: route.key }); // the sheet asks whether to empty the bag
      return;
    }
    if (result === 'closed') {
      showToast({ message: 'UA is closed – ordering is paused', icon: 'moon', tone: 'error' });
      return;
    }
    showBagAddition({ scope: route.key, name: product.name, quantity: 1 });
  };

  // Hero: stretches on overscroll (scale from the top), fades out while scrolling up; the whole header scrolls up
  // until the tab strip is pinned under the navigation header
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -interpolate(scrollY.value, [0, heroHeight], [0, heroHeight], Extrapolation.CLAMP) }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, heroHeight * 0.75], [1, 0], Extrapolation.CLAMP),
    transform: reduceMotion
      ? []
      : [{ scale: interpolate(scrollY.value, [-120, 0], [1.35, 1], Extrapolation.CLAMP) }],
    transformOrigin: 'center top',
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indX.value - tabScroll.value }, { scaleX: Math.max(indW.value, 1) / 100 }],
    transformOrigin: 'left center',
  }));

  if (!store) {
    return <EmptyState icon="storefront-outline" title="Store not found" actionLabel="Go back" onAction={() => navigation.goBack()} />;
  }

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
      {isCoffee ? (
        <LoyaltyCard
          compact
          stamps={loyalty.stamps}
          rewards={loyalty.rewards}
          style={styles.loyalty}
        />
      ) : null}
      <SeasonBanner seasons={menuSeasons} onSelectTag={diet.turnOn} onDismiss={dismissSeason} showSiyamiMarker={!hasDietaryFilterSheet} />
      {!hasDietaryFilterSheet && !isBookstore && diet.showMyDiet ? <MyDietChip tags={selectedFilters} onRemove={diet.clear} /> : null}
      {selectedFilters.length > 0 || query ? (
        <Text style={styles.countLine} accessibilityLiveRegion="polite" maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {products.length} {products.length === 1 ? 'item matches' : 'items match'}
        </Text>
      ) : null}
    </View>
  );

  const logo = getStoreLogo(store.id);

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <Reanimated.FlatList
        style={styles.menuList}
        ref={listRef}
        data={groups}
        keyExtractor={(item) => item.category}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          hasMenuSearch ? (
            <EmptyState
              icon={query ? 'search-outline' : 'leaf-outline'}
              title={query && selectedFilters.length > 0 ? 'No items match your search and filters'
                : query ? 'No items match your search' : 'No items match these filters'}
              actionLabel={query && selectedFilters.length > 0 ? 'Clear search and filters'
                : query ? 'Clear search' : 'Clear filters'}
              onAction={() => {
                if (query) setSearch('');
                if (selectedFilters.length > 0) diet.clear();
              }}
            />
          ) : <EmptyState
            icon="leaf-outline"
            title={hasDietaryFilterSheet ? 'No items match these filters' : 'Nothing matches these filters'}
            subtitle="Try removing a filter to see more of the menu."
            actionLabel="Clear filters"
            onAction={diet.clear}
          />
        }
        contentContainerStyle={[styles.content, { paddingTop: heroHeight + pinnedHeight + 8, paddingBottom: 12 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={hasMenuSearch ? 'handled' : undefined}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={hasMenuSearch ? () => { tapLockUntil.current = 0; } : undefined}
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
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              keyboardShouldPersistTaps={hasMenuSearch ? 'handled' : undefined}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={styles.productRow}
              renderItem={({ item: product, index }) => {
                const matchingExtra = matches.get(product.id)?.extra;
                const drinkFilters = isCoffee ? selectedFilters : [];
                return (
                  <ProductCard
                    product={product}
                    index={index}
                    storeOpen={isOpen}
                    showSiyamiMarker={!hasMenuSearch}
                    aligned={hasMenuSearch}
                    matchingExtra={matchingExtra}
                    reserveOptionSpace={reserveOptionSpace}
                    onPress={() => navigation.navigate('ProductDetails', {
                      productId: product.id,
                      bagFeedbackScope: route.key,
                      ...(drinkFilters.length > 0 ? { drinkFilters } : {}),
                    })}
                    onQuickAdd={quickAdd}
                  />
                );
              }}
            />
          </View>
        )}
      />

      <Reanimated.View style={[styles.header, headerStyle]}>
        <Reanimated.View style={[styles.heroWrap, hasMenuSearch && styles.compactHero, heroStyle]}>
          {logo ? <Image source={logo} resizeMode="cover" fadeDuration={0} style={styles.heroImage} accessibilityLabel={`${store.name} photo`} /> : null}
          <LinearGradient
            colors={logo
              ? ['rgba(12,38,64,0.25)', hasMenuSearch ? 'rgba(12,38,64,0.78)' : 'rgba(12,38,64,0.9)']
              : getCategoryColors(store.category)}
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

        {hasMenuSearch ? (
          <View style={styles.menuControls} onLayout={(e) => setMenuControlsHeight(e.nativeEvent.layout.height)}>
            <View style={styles.searchRow}>
              <AppInput
                icon="search"
                placeholder="Search products"
                accessibilityLabel={`Search ${store.name} products`}
                value={search}
                onChangeText={setSearch}
                clearable
                onClear={() => setSearch('')}
                autoCorrect={false}
                returnKeyType="search"
                style={styles.searchInput}
              />
              {hasDietaryFilterSheet ? (
                <DietChip iconOnly options={dietaryOptions} selected={selectedFilters} onApply={diet.apply} onClear={diet.clear} />
              ) : null}
            </View>
            {selectedFilters.length > 0 ? (
              <WrappedFlatList
                data={dietaryOptions.filter(({ id }) => selectedFilters.includes(id))}
                keyExtractor={({ id }) => id}
                wrapStyle={styles.activeFilters}
                renderItem={({ item: { id, label } }) => (
                  <Chip
                    label={label}
                    accessibilityLabel={`Remove ${label} filter`}
                    icon="close"
                    selected
                    onPress={() => diet.toggle(id)}
                  />
                )}
              />
            ) : null}
          </View>
        ) : null}
        <View style={[styles.tabsBar, hasMenuSearch && styles.fullWidthTabs]}>
          <View style={styles.tabsClip} onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}>
          <Reanimated.FlatList
            ref={tabsRef}
            data={categories}
            horizontal
            initialNumToRender={hasMenuSearch ? Math.max(1, categories.length) : undefined}
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
          {(!hasMenuSearch || allMeasured) ? (
            <Reanimated.View pointerEvents="none" style={[styles.underline, indicatorStyle]} />
          ) : null}
          </View>
          {!hasDietaryFilterSheet && !isBookstore ? <DietChip selected={selectedFilters} onToggle={diet.toggle} onClear={diet.clear} /> : null}
        </View>
      </Reanimated.View>

      <BagAdditionNotice scope={route.key} focused={focused} onView={() => navigation.navigate('MainTabs', { screen: 'Cart' })} />
    </View>
  );
}
