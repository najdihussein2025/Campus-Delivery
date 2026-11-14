import React, { useRef, useState } from 'react';
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
import { FadeInView, ShakeView, StaggerItem, SuccessCheck, animateLayout, useToast } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/money';
import { dayLabel, formatTime } from '../../utils/time';
import * as haptics from '../../utils/haptics';
import { colors, gradients, logos, MAX_FONT_SCALE } from '../../theme/theme';
import styles from './WalletScreen.styles';

const PRESETS = [500, 1000, 2000];
const MAX_TOPUP = 20000;

const TYPE_STYLES = {
  topup: { icon: 'add-circle', color: colors.success, soft: colors.successSoft, sign: '+' },
  payment: { icon: 'bag-handle', color: colors.primary, soft: colors.primarySoft, sign: '−' },
  refund: { icon: 'return-up-back', color: colors.warningText, soft: colors.warningSoft, sign: '+' },
};

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

// Chapter 19: async/await simulated top-up with loading state; transactions in a grouped FlatList
export default function WalletScreen() {
  const { wallet, topUp, timeOffsetMs } = useApp();
  const { showToast } = useToast();
  const [preset, setPreset] = useState(1000);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [doneAmount, setDoneAmount] = useState(0);
  const shakeRef = useRef(null);

  const getAmount = () => {
    if (!custom) return preset;
    if (!/^\d+(\.\d{1,2})?$/.test(custom.trim())) return NaN;
    return Math.round(parseFloat(custom) * 100);
  };

  const amount = getAmount();
  const amountValid = !!amount && !Number.isNaN(amount) && amount > 0 && amount <= MAX_TOPUP;

  const handleTopUp = async () => {
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
          <Text style={styles.balance} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(wallet.balance)}</Text>
          <Text style={styles.balanceHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>Available balance · Université Antonine</Text>
        </LinearGradient>
      </FadeInView>

      <SectionHeader title="Top up" />
      <FadeInView delay={100}>
        <ShakeView ref={shakeRef}>
          <Card>
            <View style={styles.presets}>
              {PRESETS.map((value) => (
                <Chip
                  key={value}
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
              ))}
            </View>
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
    const type = TYPE_STYLES[item.type] || TYPE_STYLES.payment;
    return (
      <StaggerItem index={index}>
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
          <Text style={[styles.txAmount, { color: item.type === 'payment' ? colors.text : colors.success }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {type.sign}
            {formatMoney(item.amount)}
          </Text>
        </View>
      </StaggerItem>
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
