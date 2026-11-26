import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { STAMPS_PER_REWARD } from '../utils/loyalty';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './LoyaltyCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

export default function LoyaltyCard({ stamps, rewards, style, compact = false }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const remaining = STAMPS_PER_REWARD - stamps;
  return (
    <Card style={[styles.card, compact && styles.compactCard, style]}>
      <View style={styles.headingRow}>
        <Ionicons name="cafe-outline" size={20} color={colors.primaryText} />
        <Text style={styles.heading} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>Coffee Rewards</Text>
      </View>
      {!compact ? <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>Earn one stamp for each eligible paid coffee delivered. Ten stamps earn a free coffee.</Text> : null}
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: STAMPS_PER_REWARD }, (_, index) => (
          <View key={index} style={[styles.slot, index < stamps && styles.filled]}>
            {index < stamps ? <Ionicons name="checkmark" size={13} color={colors.textOnDark} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.headingRow}>
        <Text style={styles.progress} maxFontSizeMultiplier={MAX_FONT_SCALE}>{stamps}/{STAMPS_PER_REWARD} stamps</Text>
        <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>{remaining} more to go</Text>
      </View>
      <View style={[styles.reward, compact && styles.compactReward]}>
        <Ionicons name="gift-outline" size={17} color={colors.warningText} />
        <View style={styles.rewardText}>
          <Text style={styles.progress} maxFontSizeMultiplier={MAX_FONT_SCALE}>{rewards} free {rewards === 1 ? 'coffee' : 'coffees'} available</Text>
          {compact || rewards > 0 ? <Text style={styles.caption} maxFontSizeMultiplier={MAX_FONT_SCALE}>Look for the gift icon on eligible coffees. Redeem your reward in the Bag.</Text> : null}
        </View>
      </View>
    </Card>
  );
}
