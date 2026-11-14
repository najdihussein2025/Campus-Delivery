import React from 'react';
import { View } from 'react-native';
import SkeletonBlock from './motion/SkeletonBlock';
import { createStyles } from './SkeletonStoreCard.styles';
import useThemedStyles from '../hooks/useThemedStyles';

// Loading placeholder shaped like a StoreCard
export default function SkeletonStoreCard() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBlock width={64} height={64} radius={12} />
        <View style={styles.lines}>
          <SkeletonBlock width="70%" height={16} />
          <SkeletonBlock width="50%" height={12} style={styles.gap} />
          <SkeletonBlock width="60%" height={12} style={styles.gap} />
        </View>
      </View>
      <SkeletonBlock width={110} height={22} radius={11} style={styles.badge} />
    </View>
  );
}
