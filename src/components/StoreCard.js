import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Badge from './Badge';
import PressableScale from './motion/PressableScale';
import StaggerItem from './motion/StaggerItem';
import { colors, getCategoryColors, MAX_FONT_SCALE } from '../theme/theme';
import styles from './StoreCard.styles';

// Store row for Home: location, prep time and live Open/Closed badge; closed stores dimmed but browsable
export default function StoreCard({ store, isOpen, onPress, location, index = 0 }) {
  return (
    <StaggerItem index={index}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.98}
        accessibilityLabel={`${store.name}, ${isOpen ? 'open' : 'closed'}`}
        style={styles.card}
      >
        <View style={[styles.inner, !isOpen && styles.dimmed]}>
          <LinearGradient colors={getCategoryColors(store.category)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
            <Ionicons name={store.icon} size={30} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.name}</Text>
            {location ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{location}</Text>
              </View>
            ) : (
              <Text style={styles.category} maxFontSizeMultiplier={MAX_FONT_SCALE}>{store.category}</Text>
            )}
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
            <Badge label={`Open · until ${store.closeTime}`} variant="open" />
          ) : (
            <Badge label={`Closed · opens ${store.openTime}`} variant="closed" />
          )}
          {!isOpen ? <Text style={styles.browse} maxFontSizeMultiplier={MAX_FONT_SCALE}>Browse menu</Text> : null}
        </View>
      </PressableScale>
    </StaggerItem>
  );
}
