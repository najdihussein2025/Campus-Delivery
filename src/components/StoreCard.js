import React from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Badge from './Badge';
import PressableScale from './motion/PressableScale';
import StaggerItem from './motion/StaggerItem';
import { fixedColors, getCategoryColors, MAX_FONT_SCALE } from '../theme/theme';
import { getStoreLogo } from '../data/images';
import { createStyles } from './StoreCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Store row for Home: logo, name + category pill, location, prep time / hours and a live Open/Closed badge;
// closed stores are dimmed but browsable
export default function StoreCard({ store, isOpen, onPress, location, statusLabel, index = 0 }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const logo = getStoreLogo(store.id);
  return (
    <StaggerItem index={index}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityLabel={`${store.name}, ${store.category}, ${location ? `${location}, ` : ''}about ${store.prepTime} minutes, ${isOpen ? 'open' : 'closed'}`}
        style={styles.card}
      >
        <View style={[styles.inner, !isOpen && styles.dimmed]}>
          {logo ? (
            <Image source={logo} resizeMode="cover" style={styles.tile} accessibilityLabel={`${store.name} logo`} />
          ) : (
            <LinearGradient colors={getCategoryColors(store.category)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
              <Ionicons name={store.icon} size={30} color={fixedColors.white} />
            </LinearGradient>
          )}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.name}</Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.category}</Text>
              </View>
            </View>
            {location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{location}</Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>≈ {store.prepTime} min</Text>
              <View style={styles.metaDot} />
              <Text style={styles.meta} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.openTime}–{store.closeTime}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
        <View style={styles.badgeRow}>
          {isOpen ? (
            <Badge label={statusLabel || `Open · until ${store.closeTime}`} variant="open" />
          ) : (
            <Badge label={statusLabel || `Closed · opens ${store.openTime}`} variant="closed" />
          )}
          {!isOpen ? <Text style={styles.browse} maxFontSizeMultiplier={MAX_FONT_SCALE}>Browse menu</Text> : null}
        </View>
      </PressableScale>
    </StaggerItem>
  );
}
