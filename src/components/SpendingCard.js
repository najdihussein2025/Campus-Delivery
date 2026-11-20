import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import SegmentedControl from './SegmentedControl';
import PressableScale from './motion/PressableScale';
import useReduceMotion from './motion/useReduceMotion';
import { formatMoney } from '../utils/money';
import { byStore, countedOrders, dailyTotals, insightLine, periodRange, periodStats, weeklyTotals } from '../utils/spending';
import * as haptics from '../utils/haptics';
import { getCategoryColors, MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './SpendingCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

const CHART_HEIGHT = 120;

// "6 dollars 75" for screen readers
const spoken = (cents) => {
  const dollars = Math.floor(cents / 100);
  const rest = cents % 100;
  if (cents === 0) return 'no spending';
  return rest === 0 ? `${dollars} dollars` : `${dollars} dollars ${rest}`;
};

// Spending insights: bar chart built from plain Views, comparison with the previous period, split by store
export default function SpendingCard({ orders, stores, now }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [kind, setKind] = useState('week');
  const [picked, setPicked] = useState(null);
  const heights = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const nowKey = Math.floor(now.getTime() / 60000);
  const data = useMemo(() => {
    const range = periodRange(kind, now);
    return {
      bars: kind === 'week' ? dailyTotals(orders, now, 7) : weeklyTotals(orders, now, 4),
      stats: periodStats(orders, range),
      stores: byStore(orders, range, stores),
      insight: insightLine(orders, range, stores),
      noun: range.noun,
    };
  }, [orders, stores, kind, nowKey]);

  const max = Math.max(1, ...data.bars.map((b) => b.cents));
  const barsKey = data.bars.map((b) => b.cents).join(',');

  // Bars grow from 0 on mount and when the data or period changes.
  // useNativeDriver must be false: native driver cannot animate `height` (a layout property).
  useEffect(() => {
    setPicked(null);
    const animations = data.bars.map((bar, i) => {
      const target = (bar.cents / max) * CHART_HEIGHT;
      if (reduceMotion) {
        heights[i].setValue(target);
        return null;
      }
      heights[i].setValue(0);
      return Animated.timing(heights[i], { toValue: target, duration: 450, useNativeDriver: false });
    });
    if (reduceMotion) return undefined;
    const run = Animated.stagger(50, animations.filter(Boolean));
    run.start();
    return () => run.stop();
  }, [barsKey, kind, reduceMotion]);

  if (countedOrders(orders).length === 0) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Spending</Text>
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={34} color={colors.primaryText} />
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>No orders yet</Text>
          <Text style={styles.emptySub} maxFontSizeMultiplier={MAX_FONT_SCALE}>Your weekly spending will show up here after your first order.</Text>
        </View>
      </Card>
    );
  }

  const { change, total, average, count } = data.stats;
  let comparison;
  if (change.pct === null) {
    comparison = count > 0 ? { text: `No orders last ${data.noun} to compare`, tone: 'muted' } : { text: `No orders this ${data.noun}`, tone: 'muted' };
  } else if (change.direction === 'up') {
    comparison = { text: `▲ ${change.pct}% vs last ${data.noun}`, tone: 'up' };
  } else if (change.direction === 'down') {
    comparison = { text: `▼ ${formatMoney(Math.abs(change.diff))} less than last ${data.noun}`, tone: 'down' };
  } else {
    comparison = { text: `Same as last ${data.noun}`, tone: 'muted' };
  }
  const toneStyle = comparison.tone === 'up' ? styles.toneUp : comparison.tone === 'down' ? styles.toneDown : styles.toneMuted;

  const pick = (index) => {
    haptics.tap();
    setPicked(picked === index ? null : index);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Spending</Text>
        <SegmentedControl
          options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
          value={kind}
          onChange={setKind}
          style={styles.segment}
        />
      </View>

      <View style={styles.chart}>
        {/* Not a FlatList: the bar chart is a fixed set of 4 or 7 drawn bars, a visual rather than a list */}
        {data.bars.map((bar, i) => (
          <PressableScale
            key={bar.date}
            onPress={() => pick(i)}
            scaleTo={0.96}
            style={styles.column}
            accessibilityLabel={`${bar.fullLabel}, ${spoken(bar.cents)}`}
          >
            <View style={styles.tipSlot}>
              {picked === i ? (
                <Text style={styles.tip} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {bar.label} · {formatMoney(bar.cents)}
                </Text>
              ) : null}
            </View>
            <View style={styles.barArea}>
              <Animated.View
                style={[styles.bar, bar.isCurrent ? styles.barCurrent : styles.barPast, { height: heights[i] }]}
              />
            </View>
            <Text style={[styles.barLabel, bar.isCurrent && styles.barLabelCurrent]} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {bar.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.flex}>
          <Text style={styles.total} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(total)}</Text>
          <Text style={[styles.comparison, toneStyle]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{comparison.text}</Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.stat} maxFontSizeMultiplier={MAX_FONT_SCALE}>Avg {formatMoney(average)} / order</Text>
          <Text style={styles.stat} maxFontSizeMultiplier={MAX_FONT_SCALE}>{count} {count === 1 ? 'order' : 'orders'}</Text>
        </View>
      </View>

      {data.stores.length > 0 ? (
        <View style={styles.storeBlock}>
          <Text style={styles.sectionLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>By store</Text>
          <View style={styles.stack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {/* Not a FlatList: coloured segments of one decorative bar (the legend below is a FlatList) */}
            {data.stores.map((s) => (
              <View key={s.storeId} style={{ flex: Math.max(s.share, 0.02), backgroundColor: getCategoryColors(s.category)[1] }} />
            ))}
          </View>
          <FlatList
            data={data.stores}
            scrollEnabled={false}
            keyExtractor={(s) => s.storeId}
            renderItem={({ item: s }) => (
              <View style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: getCategoryColors(s.category)[1] }]} />
                <Text style={styles.legendName} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{s.name}</Text>
                <Text style={styles.legendValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {formatMoney(s.cents)} · {Math.round(s.share * 100)}%
                </Text>
              </View>
            )}
          />
        </View>
      ) : null}

      <View style={styles.insight}>
        <Ionicons name="bulb-outline" size={18} color={colors.primaryText} />
        <Text style={styles.insightText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{data.insight}</Text>
      </View>
    </Card>
  );
}
