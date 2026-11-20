import React, { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Karla_600SemiBold, Karla_700Bold, Karla_800ExtraBold } from '@expo-google-fonts/karla';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { AppProvider, useApp } from './src/context/AppContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { ToastProvider } from './src/components/motion/Toast';
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

// Waits for fonts and campus data, then mounts the single NavigationContainer
function Inner({ fontsLoaded }) {
  const { loading, user } = useApp();
  const { colors, isDark } = useTheme();
  const { onReady } = useNotificationNavigation(user);
  if (!fontsLoaded || loading) return <LoadingView message="Loading CampusGo…" />;
  return (
    <ToastProvider>
      {/* Headers are UA blue in both modes, so the status bar content is always light */}
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef} theme={makeNavTheme(colors, isDark)} onReady={onReady}>
          <RootNavigator />
        </NavigationContainer>
        <OfflineBanner />
      </View>
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

  // Preload the campus photo during the splash so Welcome / Onboarding never flash white
  const [assetsReady, setAssetsReady] = useState(false);
  useEffect(() => {
    Asset.loadAsync(campusBackground)
      .catch((error) => console.log('Background preload skipped', error.message))
      .finally(() => setAssetsReady(true));
  }, []);

  // Notification handler + Android channels, once
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AppProvider>
            <Inner fontsLoaded={fontsLoaded && assetsReady} />
          </AppProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
