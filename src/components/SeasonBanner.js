import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './motion/PressableScale';
import { SEASON_BANNERS, tagLabel } from '../utils/diet';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './SeasonBanner.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Seasonal banners (Lent, Ramadan): tap turns on the season's filter, × hides that season. Several can show at once.
export default function SeasonBanner({ seasons, onSelectTag, onDismiss }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  if (!seasons || seasons.length === 0) return null;
  return (
    <View>
      {seasons.map((season) => {
        const banner = SEASON_BANNERS[season.id] || {
          text: `${season.name} – ${tagLabel(season.highlightTag)} options`,
          icon: 'sparkles',
        };
        const lent = season.id === 'lent';
        return (
          <View key={season.id} style={[styles.banner, lent ? styles.bannerLent : styles.bannerInfo]}>
            <PressableScale
              onPress={() => onSelectTag(season.highlightTag)}
              style={styles.main}
              accessibilityLabel={`${banner.text}. Tap to filter ${tagLabel(season.highlightTag)}`}
            >
              <Ionicons name={banner.icon} size={20} color={lent ? colors.warningText : colors.infoText} />
              <Text style={[styles.text, lent ? styles.textLent : styles.textInfo]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {banner.text}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => onDismiss(season)}
              hitSlop={8}
              style={styles.close}
              accessibilityLabel={`Dismiss ${season.name} banner`}
            >
              <Ionicons name="close" size={20} color={lent ? colors.warningText : colors.infoText} />
            </PressableScale>
          </View>
        );
      })}
    </View>
  );
}
