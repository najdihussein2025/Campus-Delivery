import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import StaggerItem from './motion/StaggerItem';
import { fixedColors, getCategoryColors, MAX_FONT_SCALE } from '../theme/theme';
import { getStoreThumbnail, getStoreLogo } from '../data/images';
import { createStyles } from './StoreCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

export default function StoreCard({ store, isOpen, onPress, location, statusLabel, freeCoffeeReady, index = 0 }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const logo = getStoreThumbnail(store.id) || getStoreLogo(store.id);
  const status = statusLabel || (isOpen ? `Open · until ${store.closeTime}` : `Closed · opens ${store.openTime}`);
  return (
    <StaggerItem index={index}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityLabel={`${store.name}, ${store.category}, ${location ? `${location}, ` : ''}about ${store.prepTime} minutes, ${status}${freeCoffeeReady ? ', Free coffee ready' : ''}`}
        style={styles.card}
      >
        <View style={styles.inner}>
          {logo ? (
            <Image source={logo} resizeMode="cover" fadeDuration={0} style={[styles.tile, styles.photoPlaceholder]} />
          ) : (
            <LinearGradient colors={getCategoryColors(store.category)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
              <Ionicons name={store.icon} size={30} color={fixedColors.white} />
            </LinearGradient>
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.name}</Text>
            {location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.meta} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{location}</Text>
              </View>
            ) : null}
            <View style={styles.prepRow}>
              <Text style={styles.category} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.category}</Text>
              <View style={styles.prep}>
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>≈ {store.prepTime} min prep</Text>
              </View>
            </View>
            <Text style={[styles.status, isOpen ? styles.open : styles.closed]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{status}</Text>
            {freeCoffeeReady ? (
              <View style={styles.metaRow}>
                <Ionicons name="gift-outline" size={13} color={colors.primaryText} />
                <Text style={[styles.meta, styles.reward]} maxFontSizeMultiplier={MAX_FONT_SCALE}>Free coffee ready</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </PressableScale>
    </StaggerItem>
  );
}
