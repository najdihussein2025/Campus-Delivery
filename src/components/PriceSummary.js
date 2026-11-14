import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors } from '../theme/theme';
import { formatMoney } from '../utils/money';
import styles from './PriceSummary.styles';

function Row({ label, value, strong, free }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.labelStrong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.valueStrong, free && styles.valueFree]}>{value}</Text>
    </View>
  );
}

function Hint({ icon, text, danger }) {
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
  const { subtotal, deliveryFee, total, missingForMinimum, missingForFreeDelivery } = totals;
  return (
    <Card style={style}>
      <Row label="Subtotal" value={formatMoney(subtotal)} />
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
