import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';

import { formatMoney } from '../utils/money';
import { createStyles } from './PriceSummary.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

function Row({ label, value, strong, free }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.labelStrong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.valueStrong, free && styles.valueFree]}>{value}</Text>
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
export default function PriceSummary({ totals, showHints = true, style }) {
  const styles = useThemedStyles(createStyles);
  const { gross, discount = 0, subtotal, deliveryFee, total, missingForMinimum, missingForFreeDelivery } = totals;
  return (
    <Card style={style}>
      <Row label="Subtotal" value={formatMoney(discount > 0 ? gross : subtotal)} />
      {discount > 0 ? <Row label="Free coffee (loyalty)" value={`−${formatMoney(discount)}`} free /> : null}
      <Row label="Delivery fee" value={deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee)} free={deliveryFee === 0} />
      <View style={styles.divider} />
      <Row label="Total" value={formatMoney(total)} strong />
      {showHints && missingForMinimum > 0 ? (
        <Hint danger icon="alert-circle" text={`Add ${formatMoney(missingForMinimum)} more to reach the $2.00 minimum`} />
      ) : null}
      {showHints && missingForMinimum === 0 && missingForFreeDelivery > 0 ? (
        <Hint icon="bicycle" text={`Add ${formatMoney(missingForFreeDelivery)} more for free delivery`} />
      ) : null}
    </Card>
  );
}
