import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { MAX_FONT_SCALE } from '../theme/theme';

import { formatMoney } from '../utils/money';
import { createStyles } from './PriceSummary.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

import AnimatedNumber from './motion/AnimatedNumber';

// `cents` (optional): the value rolls to the new amount (AnimatedNumber); otherwise `value` is shown as text
function Row({ label, value, cents, strong, free }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.labelStrong]}>{label}</Text>
      {cents !== undefined ? (
        <AnimatedNumber value={cents} format={formatMoney} style={[styles.value, strong && styles.valueStrong, free && styles.valueFree]} />
      ) : (
        <Text style={[styles.value, strong && styles.valueStrong, free && styles.valueFree]}>{value}</Text>
      )}
    </View>
  );
}

function Hint({ icon, text, danger }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.info;
  return (
    <View style={[styles.hint, danger ? styles.hintDanger : styles.hintInfo]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.hintText, danger ? styles.hintTextDanger : styles.hintTextInfo]}>{text}</Text>
    </View>
  );
}

// Subtotal / delivery fee / total with the minimum-order and free-delivery hints
export default function PriceSummary({ totals, showHints = true, compact = false, style, title, children }) {
  const styles = useThemedStyles(createStyles);
  const { gross, discount = 0, subtotal, deliveryFee, total, missingForMinimum, missingForFreeDelivery } = totals;
  return (
    <Card style={style}>
      {title ? <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text> : null}
      {children}
      <Row label={discount > 0 && !compact ? "Original subtotal" : "Subtotal"} value={formatMoney(discount > 0 ? gross : subtotal)} />
      {discount > 0 ? <Row label={compact ? "Coffee reward" : "Coffee reward discount"} value={`−${formatMoney(discount)}`} free /> : null}
      {discount > 0 && !compact ? <Row label="Discounted subtotal" value={formatMoney(subtotal)} /> : null}
      <Row label="Delivery fee" value={deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee)} free={deliveryFee === 0} />
      <View style={styles.divider} />
      <Row label="Total" cents={total} strong />
      {showHints && missingForMinimum > 0 ? (
        <Hint danger icon="alert-circle" text={`Add ${formatMoney(missingForMinimum)} more to reach the $2.00 minimum`} />
      ) : null}
      {showHints && missingForMinimum === 0 && missingForFreeDelivery > 0 ? (
        <Hint icon="bicycle" text={`Add ${formatMoney(missingForFreeDelivery)} more for free delivery`} />
      ) : null}
    </Card>
  );
}
