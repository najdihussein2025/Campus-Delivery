import React from 'react';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import Card from '../../components/Card';
import DoorSign from '../../components/DoorSign';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { getCategoryIcon, MAX_FONT_SCALE, spacing } from '../../theme/theme';
import { formatMoney } from '../../utils/money';
import { deliveryBreakLabel, deliveryDateLabel, scheduledEta } from '../../utils/orderDetails';
import { formatFloorLong } from '../../utils/time';
import { createStyles } from './OrderConfirmationScreen.styles';

function SummaryRow({ icon, label, value, children, first = false }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={styles.rowIcon} accessibilityElementsHidden importantForAccessibility="no">
        <Ionicons name={icon} size={18} color={colors.primaryText} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
        <Text style={styles.value} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
        {children}
      </View>
    </View>
  );
}

export default function OrderConfirmationScreen({ navigation, route }) {
  const { order } = route.params;
  const { getStore, getBuilding, getOrderSlot } = useApp();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const store = getStore(order.storeId);
  const building = getBuilding(order.building);
  const floor = formatFloorLong(Number(order.room.split('.')[1]));
  const paidByWallet = order.payment === 'wallet';

  return (
    <View style={styles.screen}>
      {isFocused ? (
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            paddingLeft: insets.left + spacing.lg,
            paddingRight: insets.right + spacing.lg,
          },
        ]}
      >
        <View style={styles.body}>
          <View style={styles.intro}>
            <View style={styles.check} accessibilityElementsHidden importantForAccessibility="no">
              <Ionicons name="checkmark" size={28} color={colors.successText} />
            </View>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE} accessibilityRole="header">Order placed!</Text>
            <Text style={styles.message} maxFontSizeMultiplier={MAX_FONT_SCALE}>Your order has been successfully received.</Text>
            <Text style={styles.number} maxFontSizeMultiplier={MAX_FONT_SCALE}>Order #{order.number}</Text>
          </View>

          <Card style={styles.summary}>
            <SummaryRow first icon={getCategoryIcon(store?.category)} label="Ordering from" value={store?.name} />
            <SummaryRow icon="time-outline" label="Scheduled delivery" value={deliveryBreakLabel(getOrderSlot(order))}>
              <Text style={styles.detail} maxFontSizeMultiplier={MAX_FONT_SCALE}>{deliveryDateLabel(order)}</Text>
              {scheduledEta(order) ? <Text style={styles.detail} maxFontSizeMultiplier={MAX_FONT_SCALE}>Estimated arrival {scheduledEta(order)}</Text> : null}
            </SummaryRow>
            <SummaryRow icon="location-outline" label="Delivery location" value={building?.name}>
              <Text style={styles.detail} maxFontSizeMultiplier={MAX_FONT_SCALE}>{floor}</Text>
              <DoorSign code={order.room} size="sm" style={styles.room} />
            </SummaryRow>
            <SummaryRow
              icon={paidByWallet ? 'wallet-outline' : 'cash-outline'}
              label="Payment"
              value={paidByWallet ? 'Campus Wallet' : 'Cash on Delivery'}
            >
              {order.discount > 0 ? (
                <Text style={styles.detail} maxFontSizeMultiplier={MAX_FONT_SCALE}>Coffee reward discount {'−'}{formatMoney(order.discount)}</Text>
              ) : null}
              <Text style={styles.total} maxFontSizeMultiplier={MAX_FONT_SCALE}>Total {formatMoney(order.total)}</Text>
            </SummaryRow>
          </Card>

          <View style={styles.actions}>
            <AppButton title="Track order" icon="navigate-outline" onPress={() => navigation.replace('Tracking', { orderId: order.id })} />
            <AppButton
              title="Back to home"
              icon="home-outline"
              variant="secondary"
              onPress={() => navigation.popTo('MainTabs', { screen: 'Home' })}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
