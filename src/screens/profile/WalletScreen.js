import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, StatusBar, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import SpendingCard from '../../components/SpendingCard';
import Reanimated, { FadeIn, SlideInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedNumber, FadeInView, ShakeView, StaggerItem, SuccessCheck, animateLayout, useReduceMotion, useToast } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/money';
import { dayLabel, formatTime, getNow } from '../../utils/time';
import * as haptics from '../../utils/haptics';
import { gradients, logos, MAX_FONT_SCALE } from '../../theme/theme';
import { createStyles } from './WalletScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';

const PRESETS = [500, 1000, 2000];
const MAX_TOPUP = 20000;

// Icon, colours and sign for each transaction type, from the active palette
const makeTypeStyles = (colors) => ({
  topup: { icon: 'add-circle', color: colors.success, soft: colors.successSoft, sign: '+' },
  payment: { icon: 'bag-handle', color: colors.primaryText, soft: colors.primarySoft, sign: '−' },
  refund: { icon: 'return-up-back', color: colors.warningText, soft: colors.warningSoft, sign: '+' },
});

// Group transactions by day: a flat list of header rows and transaction rows for one FlatList
const groupByDay = (transactions, timeOffsetMs) => {
  const rows = [];
  let lastLabel = null;
  transactions.forEach((t) => {
    const label = dayLabel(t.date, timeOffsetMs);
    if (label !== lastLabel) {
      rows.push({ kind: 'day', id: `day-${label}-${t.id}`, label });
      lastLabel = label;
    }
    rows.push({ kind: 'tx', ...t });
  });
  return rows;
};

// A transaction added while this screen is open slides in at the top, with a highlight that fades out
function NewRow({ children, color }) {
  const reduceMotion = useReduceMotion();
  const glow = useSharedValue(reduceMotion ? 0 : 1);
  useEffect(() => {
    if (!reduceMotion) glow.value = withTiming(0, { duration: 1600 });
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.45 }));
  return (
    <Reanimated.View entering={reduceMotion ? FadeIn.duration(150) : SlideInUp.duration(320)}>
      {children}
      <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 14, backgroundColor: color }, glowStyle]} />
    </Reanimated.View>
  );
}

// Chapter 19: async/await simulated top-up with loading state; transactions in a grouped FlatList
export default function WalletScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { wallet, topUp, timeOffsetMs, orders, campus } = useApp();
  const { isOnline } = useNetwork();
  const { showToast } = useToast();
  const [preset, setPreset] = useState(1000);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [doneAmount, setDoneAmount] = useState(0);
  const shakeRef = useRef(null);
  const initialIds = useRef(new Set(wallet.transactions.map((t) => t.id))); // rows that existed when the screen opened

  const getAmount = () => {
    if (!custom) return preset;
    if (!/^\d+(\.\d{1,2})?$/.test(custom.trim())) return NaN;
    return Math.round(parseFloat(custom) * 100);
  };

  const amount = getAmount();
  const amountValid = !!amount && !Number.isNaN(amount) && amount > 0 && amount <= MAX_TOPUP;

  const handleTopUp = async () => {
    if (!isOnline) return;
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount, e.g. 15 or 7.50');
      shakeRef.current?.shake();
      return;
    }
    if (amount > MAX_TOPUP) {
      setError('Maximum top-up is $200.00');
      shakeRef.current?.shake();
      return;
    }
    setError('');
    setLoading(true);
    await topUp(amount);
    setLoading(false);
    setCustom('');
    animateLayout();
    haptics.success();
    setDoneAmount(amount);
  };

  const closeSuccess = () => {
    showToast({ message: `Top-up successful · +${formatMoney(doneAmount)}`, icon: 'checkmark-circle', tone: 'success' });
    setDoneAmount(0);
  };

  const header = (
    <View>
      <FadeInView>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
          <Image source={logos.white} resizeMode="contain" style={styles.watermark} />
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>CAMPUS WALLET</Text>
            <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.7)" style={styles.contactless} />
          </View>
          <AnimatedNumber value={wallet.balance} format={formatMoney} style={styles.balance} />
          <Text style={styles.balanceHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>Available balance · Université Antonine</Text>
        </LinearGradient>
      </FadeInView>

      <FadeInView delay={60}>
        <SpendingCard orders={orders} stores={campus.stores} now={getNow(timeOffsetMs)} />
      </FadeInView>

      <SectionHeader title="Top up" />
      <FadeInView delay={100}>
        <ShakeView ref={shakeRef}>
          <Card>
            <FlatList
              data={PRESETS}
              numColumns={PRESETS.length}
              scrollEnabled={false}
              keyExtractor={(value) => String(value)}
              extraData={{ custom, preset }}
              style={styles.presets}
              renderItem={({ item: value }) => (
                <Chip
                  label={formatMoney(value)}
                  selected={!custom && preset === value}
                  onPress={() => {
                    animateLayout();
                    setPreset(value);
                    setCustom('');
                    setError('');
                  }}
                  style={styles.presetChip}
                />
              )}
            />
            <AppInput
              label="Or a custom amount"
              icon="cash-outline"
              placeholder="e.g. 15.00 (max 200)"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleTopUp}
              value={custom}
              onChangeText={(text) => {
                setCustom(text);
                setError('');
              }}
              clearable
              onClear={() => setCustom('')}
              error={error}
            />
            <AppButton
              title={amountValid ? `Top up ${formatMoney(amount)}` : 'Top up'}
              icon="add-circle-outline"
              onPress={handleTopUp}
              loading={loading}
              disabled={!isOnline}
              reason="Top-ups need a connection."
            />
            <Text style={styles.note} maxFontSizeMultiplier={MAX_FONT_SCALE}>Simulated payment for the demo – no card is charged.</Text>
          </Card>
        </ShakeView>
      </FadeInView>

      <SectionHeader title="Transactions" />
    </View>
  );

  const renderItem = ({ item, index }) => {
    if (item.kind === 'day') {
      return <Text style={styles.dayLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.label}</Text>;
    }
    const typeStyles = makeTypeStyles(colors);
    const type = typeStyles[item.type] || typeStyles.payment;
    const Wrapper = initialIds.current.has(item.id) ? StaggerItem : NewRow;
    return (
      <Wrapper index={index} color={colors.accentSoft}>
        <View style={styles.txRow}>
          <View style={[styles.txIcon, { backgroundColor: type.soft }]}>
            <Ionicons name={type.icon} size={20} color={type.color} />
          </View>
          <View style={styles.txText}>
            <Text style={styles.txLabel} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.label}</Text>
            <Text style={styles.txDate} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {formatTime(new Date(item.date))} · {item.type === 'topup' ? 'Top-up' : item.type === 'refund' ? 'Refund' : 'Payment'}
            </Text>
          </View>
          <Text style={[styles.txAmount, { color: item.type === 'payment' ? colors.text : colors.successText }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {type.sign}
            {formatMoney(item.amount)}
          </Text>
        </View>
      </Wrapper>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={groupByDay(wallet.transactions, timeOffsetMs)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Top-ups, payments and refunds will show up here." />}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />

      <ConfirmModal
        visible={doneAmount > 0}
        title="Top-up successful"
        message={`${formatMoney(doneAmount)} was added. New balance: ${formatMoney(wallet.balance)}.`}
        icon="checkmark-circle"
        tone="success"
        confirmLabel="Done"
        cancelLabel={null}
        onConfirm={closeSuccess}
      >
        <View style={styles.successCheck}>
          <SuccessCheck size={84} />
        </View>
      </ConfirmModal>
    </View>
  );
}
