import React, { useEffect, useRef, useState } from 'react';
import { Asset } from 'expo-asset';
import { StatusBar, StyleSheet, View } from 'react-native';
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Karla_600SemiBold, Karla_700Bold, Karla_800ExtraBold } from '@expo-google-fonts/karla';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { ToastProvider } from './src/components/motion/Toast';
import { FlyToBagProvider } from './src/components/motion/FlyToBag';
import OfflineBanner from './src/components/OfflineBanner';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import LoadingView from './src/components/LoadingView';
import useNotificationNavigation from './src/hooks/useNotificationNavigation';
import { configureNotifications } from './src/services/notifications';
import { campusBackground } from './src/data/backgrounds';

// Builds the React Navigation theme (tab bar, headers, cards) from our palette
const makeNavTheme = (colors, isDark) => {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: colors.primaryText,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
};

// Theme switch: the screen cross-fades (~200 ms) instead of flashing. An overlay in the OLD background colour is laid
// over the app and fades out, revealing the new theme underneath.
function ThemeFade() {
  const { colors } = useTheme();
  const previous = useRef(colors.background);
  const [overlay, setOverlay] = useState(null);
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (previous.current === colors.background) return;
    setOverlay(previous.current);
    previous.current = colors.background;
    opacity.value = 1;
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(setOverlay)(null);
    });
  }, [colors.background]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (!overlay) return null;
  return <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: overlay, zIndex: 500 }, style]} />;
}

// Waits for fonts and campus data, then mounts the single NavigationContainer
function Inner({ fontsLoaded }) {
  const { loading, user } = useApp();
  const { colors, isDark } = useTheme();
  const { onReady } = useNotificationNavigation(user);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const needsBackground = !loading && !user && !backgroundReady;
  useEffect(() => {
    if (!needsBackground) return;
    let active = true;
    Asset.loadAsync(campusBackground)
      .catch((error) => console.log('Background preload skipped', error.message))
      .finally(() => { if (active) setBackgroundReady(true); });
    return () => { active = false; };
  }, [needsBackground]);
  if (!fontsLoaded || loading || needsBackground) return <LoadingView message="Loading CampusGo…" />;
  return (
    <ToastProvider>
      {/* Headers are UA blue in both modes, so the status bar content is always light */}
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <FlyToBagProvider>
        <View style={{ flex: 1 }}>
          <NavigationContainer ref={navigationRef} theme={makeNavTheme(colors, isDark)} onReady={onReady}>
            <RootNavigator />
          </NavigationContainer>
          <OfflineBanner />
          <ThemeFade />
        </View>
      </FlyToBagProvider>
    </ToastProvider>
  );
}

// UA typography: Karla for titles/prices/buttons, Roboto for body text
export default function App() {
  const [fontsLoaded] = useFonts({
    Karla_600SemiBold,
    Karla_700Bold,
    Karla_800ExtraBold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Notification handler + Android channels, once
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AppProvider>
            <Inner fontsLoaded={fontsLoaded} />
          </AppProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
