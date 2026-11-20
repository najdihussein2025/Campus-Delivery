import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import { gradients, MAX_FONT_SCALE } from '../theme/theme';
import { formatMoney } from '../utils/money';
import { createStyles } from './WalletBanner.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Home hero: next class break with a live countdown, plus wallet balance and a Top up pill
export default function WalletBanner({ nextSlot, minutesLeft, missedNote, balance, onTopUp, emptyText, closedInfo }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.circleBig} />
      <View style={styles.circleSmall} />

      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.micro} maxFontSizeMultiplier={MAX_FONT_SCALE}>{closedInfo ? 'University closed' : 'Next break'}</Text>
          {closedInfo ? (
            <>
              <Text style={[styles.slot, styles.slotNone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{closedInfo.emoji} {closedInfo.reason}</Text>
              {closedInfo.opensText ? (
                <Text style={styles.countdown} maxFontSizeMultiplier={MAX_FONT_SCALE}>Ordering opens {closedInfo.opensText}</Text>
              ) : null}
            </>
          ) : nextSlot ? (
            <>
              <Text style={styles.slot} maxFontSizeMultiplier={MAX_FONT_SCALE}>{nextSlot.label}</Text>
              {typeof minutesLeft === 'number' ? (
                <Text style={styles.countdown} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {minutesLeft > 0 ? (
                    <>
                      Order in the next <Text style={styles.countdownStrong}>{minutesLeft} min</Text> to make it
                    </>
                  ) : (
                    'Order now – last minute for this break'
                  )}
                </Text>
              ) : null}
              {missedNote ? <Text style={styles.missed} maxFontSizeMultiplier={MAX_FONT_SCALE}>{missedNote}</Text> : null}
            </>
          ) : (
            <Text style={[styles.slot, styles.slotNone]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {emptyText || 'No more breaks today'}
            </Text>
          )}
        </View>
        <View style={styles.clock}>
          <Ionicons name="time" size={22} color={colors.accent} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.walletIcon}>
          <Ionicons name="wallet" size={17} color={colors.primaryDark} />
        </View>
        <Text style={styles.walletLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Wallet</Text>
        <Text style={styles.balance} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatMoney(balance)}</Text>
        <PressableScale onPress={onTopUp} haptic accessibilityLabel="Top up wallet" style={styles.pill}>
          <Ionicons name="add" size={16} color={colors.primaryDark} />
          <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Top up</Text>
        </PressableScale>
      </View>
    </LinearGradient>
  );
}
