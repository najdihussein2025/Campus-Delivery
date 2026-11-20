import React, { useRef } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from './ProductImage';
import PressableScale from './motion/PressableScale';
import StaggerItem from './motion/StaggerItem';
import { MAX_FONT_SCALE } from '../theme/theme';
import { formatMoney } from '../utils/money';
import { createStyles } from './ProductCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Fixed-width product tile for horizontal lists; out-of-stock items get a grey overlay + pill.
// The "+" adds a product without options straight to the bag (onQuickAdd, with the fly-to-bag animation);
// products with sizes or extras open the product sheet instead.
export default function ProductCard({ product, onPress, onQuickAdd, storeOpen = true, index = 0 }) {
  const imageRef = useRef(null);
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const addable = product.inStock && storeOpen;
  const hasOptions = Boolean((product.options?.sizes || []).length || (product.options?.extras || []).length);
  return (
    <StaggerItem index={index}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${product.name}, ${formatMoney(product.price)}${product.inStock ? '' : ', out of stock'}`}
        style={styles.card}
      >
        <View ref={imageRef} collapsable={false}>
          <ProductImage category={product.category} productId={product.id} size={110} rounded={14} />
          {!product.inStock ? (
            <View style={styles.overlay}>
              <View style={styles.oosPill}>
                <Text style={styles.oosText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Out of stock</Text>
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, !product.inStock && styles.muted]} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {product.name}
            {product.tags && product.tags.includes('siyami') ? ' ✝️' : ''}
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.price, !product.inStock && styles.muted]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {formatMoney(product.price)}
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
