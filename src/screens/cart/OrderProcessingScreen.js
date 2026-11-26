import React, { useEffect, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, usePreventRemove } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useReduceMotion from '../../components/motion/useReduceMotion';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { makeTypography, MAX_FONT_SCALE, radius, spacing } from '../../theme/theme';
import * as haptics from '../../utils/haptics';

const PROCESSING_MS = 1200;

export default function OrderProcessingScreen({ navigation, route }) {
  const { order } = route.params;
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const [rotation] = useState(() => new Animated.Value(0));
  const [finished, setFinished] = useState(false);
  usePreventRemove(!finished, () => {});

  useEffect(() => {
    const timer = setTimeout(() => setFinished(true), PROCESSING_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!finished) return;
    haptics.success();
    navigation.replace('OrderConfirmation', { order });
  }, [finished, navigation, order]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const spin = Animated.loop(Animated.timing(rotation, {
      toValue: 1,
      duration: 850,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    }));
    spin.start();
    return () => {
      spin.stop();
      rotation.setValue(0);
    };
  }, [reduceMotion, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.screen}>
      {isFocused ? (
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      ) : null}
      <View style={styles.indicator} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.icon}>
          <Ionicons name="bag-handle-outline" size={28} color={colors.primaryText} />
        </View>
        <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
      </View>
      <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {'Placing your order\u2026'}
      </Text>
      <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Please wait while we confirm your order.</Text>
      <Text style={styles.supporting} maxFontSizeMultiplier={MAX_FONT_SCALE}>Do not close the app.</Text>
    </SafeAreaView>
  );
}

const createStyles = (colors) => {
  const type = makeTypography(colors);
  return StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      backgroundColor: colors.background,
    },
    indicator: {
      width: 84,
      height: 84,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    icon: {
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ring: {
      ...StyleSheet.absoluteFillObject,
      borderWidth: 3,
      borderRadius: radius.pill,
      borderColor: colors.border,
      borderTopColor: colors.primaryText,
      borderRightColor: colors.primaryText,
    },
    title: { ...type.h1, textAlign: 'center' },
    subtitle: { ...type.body, textAlign: 'center' },
    supporting: { ...type.caption, textAlign: 'center', marginTop: spacing.sm },
  });
};
