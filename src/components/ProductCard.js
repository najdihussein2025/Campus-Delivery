import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from './ProductImage';
import PressableScale from './motion/PressableScale';
import StaggerItem from './motion/StaggerItem';
import { colors, MAX_FONT_SCALE } from '../theme/theme';
import { formatMoney } from '../utils/money';
import styles from './ProductCard.styles';

// Fixed-width product tile for horizontal lists; out-of-stock items get a grey overlay + pill
export default function ProductCard({ product, onPress, storeOpen = true, index = 0 }) {
  const addable = product.inStock && storeOpen;
  return (
    <StaggerItem index={index}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${product.name}, ${formatMoney(product.price)}${product.inStock ? '' : ', out of stock'}`}
        style={styles.card}
      >
        <View>
          <ProductImage category={product.category} size={110} rounded={14} />
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
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.price, !product.inStock && styles.muted]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {formatMoney(product.price)}
            </Text>
            {addable ? (
              <View style={styles.plus}>
                <Ionicons name="add" size={18} color={colors.textOnDark} />
              </View>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </StaggerItem>
  );
}
