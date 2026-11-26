import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import LoyaltyCard from '../../components/LoyaltyCard';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import { FadeInView, StaggerItem } from '../../components/motion';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { formatDate } from '../../utils/time';
import { createStyles } from './LoyaltyScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const HOW_IT_WORKS = [
  { icon: 'cafe', text: 'Each eligible paid coffee earns one stamp when delivered.' },
  { icon: 'gift', text: '10 stamps = 1 free coffee. Extra stamps carry over.' },
  { icon: 'bag-check', text: 'Apply one reward per order in the Bag. It covers the highest-priced eligible coffee, including its size. Extras stay payable.' },
];

// Loyalty screen: the big stamp card, how it works in 3 lines and the history (FlatList)
export default function LoyaltyScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { loyalty, orders } = useApp();

  const describe = (entry) => {
    const order = orders.find((o) => o.id === entry.orderId);
    const ref = order ? ` · Order #${order.number}` : '';
    if (entry.type === 'earned') return { icon: 'add-circle', tone: colors.successText, title: `+${entry.count} ${entry.count === 1 ? 'stamp' : 'stamps'}${ref}` };
    if (entry.type === 'redeemed') return { icon: 'gift', tone: colors.primaryText, title: `Free coffee used${ref}` };
    return { icon: 'return-up-back', tone: colors.warningText, title: `Free coffee given back${ref}` };
  };

  const renderEntry = ({ item, index }) => {
    const info = describe(item);
    return (
      <StaggerItem index={index}>
        <View style={styles.entry}>
          <Ionicons name={info.icon} size={22} color={info.tone} />
          <View style={styles.entryText}>
            <Text style={styles.entryTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>{info.title}</Text>
            <Text style={styles.entryDate} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatDate(item.at)}</Text>
          </View>
        </View>
      </StaggerItem>
    );
  };

  const header = (
    <View>
      <FadeInView>
        <LoyaltyCard stamps={loyalty.stamps} rewards={loyalty.rewards} />
      </FadeInView>
      <Card style={styles.how}>
        <FlatList
          data={HOW_IT_WORKS}
          scrollEnabled={false}
          keyExtractor={(row) => row.icon}
          renderItem={({ item: row }) => (
            <View style={styles.howRow}>
              <View style={styles.howIcon}>
                <Ionicons name={row.icon} size={18} color={colors.primaryText} />
              </View>
              <Text style={styles.howText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{row.text}</Text>
            </View>
          )}
        />
      </Card>
      <AppButton title="Browse Coffee Corner" icon="cafe-outline" variant="secondary" onPress={() => navigation.navigate('StoreMenu', { storeId: 'coffee' })} />
      <SectionHeader title="History" />
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={loyalty.history}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState icon="cafe-outline" title="No stamps yet" subtitle="Order a coffee from the Coffee Corner to start your card." />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
