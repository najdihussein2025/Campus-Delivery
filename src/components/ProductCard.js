import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from './ProductImage';
import PressableScale from './motion/PressableScale';
import StaggerItem from './motion/StaggerItem';
import { MAX_FONT_SCALE } from '../theme/theme';
import { formatMoney } from '../utils/money';
import { hasProductOptions } from '../utils/cart';
import { createStyles, PRODUCT_IMAGE_HEIGHT } from './ProductCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Fixed-width product tile for horizontal lists; out-of-stock items get a grey overlay + pill.
// The "+" adds a product without options straight to the bag (onQuickAdd, with the fly-to-bag animation);
// products with sizes or extras open the product sheet instead.
export default function ProductCard({
  product, onPress, onQuickAdd, storeOpen = true, index = 0, showSiyamiMarker = true,
  matchingExtra, aligned = false, reserveOptionSpace = false,
}) {
  const imageRef = useRef(null);
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const addable = product.inStock && storeOpen;
  const rewardEligible = product.storeId === 'coffee' && product.loyalty === 'coffee';
  const hasOptions = hasProductOptions(product);
  const price = product.price + (matchingExtra?.extra ?? 0);
  const stockBadge = !product.inStock ? (
    <View style={[styles.oosPill, aligned && styles.photoBadge]} pointerEvents="none">
      <Text style={styles.oosText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Out of stock</Text>
    </View>
  ) : null;
  return (
    <StaggerItem index={index}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${product.name}${matchingExtra ? `, ${matchingExtra.label} substitution` : ''}, ${formatMoney(price)}${product.inStock ? '' : ', out of stock'}${rewardEligible ? ', eligible for coffee rewards' : ''}`}
        style={[styles.card, aligned && styles.alignedCard, reserveOptionSpace && styles.cardWithOption]}
      >
        <View ref={imageRef} collapsable={false} style={aligned ? styles.alignedImage : undefined}>
          <ProductImage category={product.category} productId={product.id} size={PRODUCT_IMAGE_HEIGHT} rounded={14} />
          {rewardEligible ? (
            <View style={styles.rewardBadge} pointerEvents="none">
              <Ionicons name="gift-outline" size={15} color={colors.warningText} />
            </View>
          ) : null}
          {aligned ? stockBadge : stockBadge && <View style={styles.overlay} pointerEvents="none">{stockBadge}</View>}
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, aligned && styles.alignedName, !product.inStock && styles.muted]} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {product.name}
            {showSiyamiMarker && product.tags?.includes('siyami') ? ' ✝️' : ''}
          </Text>
          {reserveOptionSpace || matchingExtra ? (
            <View style={reserveOptionSpace ? styles.optionSlot : undefined}>
              {matchingExtra ? (
                <Text style={styles.option} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {matchingExtra.label} substitution
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={[styles.footer, aligned && styles.alignedFooter]}>
            <Text style={[styles.price, !product.inStock && styles.muted]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {formatMoney(price)}
            </Text>
            {addable ? (
              <PressableScale
                onPress={() => (hasOptions || !onQuickAdd ? onPress() : onQuickAdd(product, imageRef))}
                hitSlop={8}
                style={styles.plus}
                accessibilityLabel={hasOptions ? `Choose options for ${product.name}` : `Add ${product.name} to bag`}
              >
                <Ionicons name="add" size={18} color={colors.textOnDark} />
              </PressableScale>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </StaggerItem>
  );
}
