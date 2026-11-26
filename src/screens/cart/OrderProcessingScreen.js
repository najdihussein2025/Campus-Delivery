import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, usePreventRemove } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useReduceMotion from '../../components/motion/useReduceMotion';
import { useApp } from '../../context/AppContext';
import { useNetwork } from '../../context/NetworkContext';
import { useTheme } from '../../context/ThemeContext';
import useThemedStyles from '../../hooks/useThemedStyles';
import { makeTypography, MAX_FONT_SCALE, radius, spacing } from '../../theme/theme';
import * as haptics from '../../utils/haptics';

const PROCESSING_MS = 1200;
const ORDER_ERROR = 'Could not place the order. Check your bag, delivery slot and payment.';

export default function OrderProcessingScreen({ navigation, route }) {
  const { checkoutKey, request } = route.params;
  const { placeOrder } = useApp();
  const { isOnline } = useNetwork();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isFocused = useIsFocused();
  const reduceMotion = useReduceMotion();
  const [rotation] = useState(() => new Animated.Value(0));
  const submitted = useRef(false);
  const [result, setResult] = useState(null);
  usePreventRemove(!result, () => {});

  const submit = useEffectEvent(() => {
    if (submitted.current) return;
    submitted.current = true;
    if (!isOnline) {
      setResult({ error: "You're offline. Reconnect to place your order." });
      return;
    }
    try {
      const order = placeOrder(request);
      setResult(order ? { order } : { error: ORDER_ERROR });
    } catch (error) {
      console.log('Checkout failed', error.message);
      setResult({ error: ORDER_ERROR });
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => submit(), PROCESSING_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!result) return;
    if (result.error) {
      navigation.popTo('Checkout', { processingError: result.error });
      return;
    }

    const state = navigation.getState();
    const checkoutIndex = state.routes.findIndex((entry) => entry.key === checkoutKey);
    const routes = [
      ...state.routes.slice(0, checkoutIndex),
      { name: 'OrderConfirmation', params: { order: result.order } },
    ];
    haptics.success();
    navigation.reset({ index: routes.length - 1, routes });
  }, [checkoutKey, navigation, result]);

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
