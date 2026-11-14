import React from 'react';
import { Text, View } from 'react-native';
import { MAX_FONT_SCALE } from '../theme/theme';
import styles from './DoorSign.styles';

// Room code styled like a campus door plate: "G.2.15" on UA blue, with an optional subtitle
export default function DoorSign({ code, subtitle, size = 'md', style }) {
  return (
    <View style={[styles.wrapper, style]} accessibilityLabel={`Room ${code}${subtitle ? `, ${subtitle}` : ''}`}>
      <View style={[styles.plate, styles[`plate_${size}`]]}>
        <View style={styles.screwLeft} />
        <Text style={[styles.code, styles[`code_${size}`]]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {code}
        </Text>
        <View style={styles.screwRight} />
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, size === 'sm' && styles.subtitleSmall]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
