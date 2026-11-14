import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Karla_600SemiBold, Karla_700Bold, Karla_800ExtraBold } from '@expo-google-fonts/karla';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { AppProvider, useApp } from './src/context/AppContext';
import { ToastProvider } from './src/components/motion/Toast';
import RootNavigator from './src/navigation/RootNavigator';
import LoadingView from './src/components/LoadingView';
import { colors } from './src/theme/theme';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

// Waits for fonts and campus data, then mounts the single NavigationContainer
function Inner({ fontsLoaded }) {
  const { loading } = useApp();
  if (!fontsLoaded || loading) return <LoadingView message="Loading CampusGo…" />;
  return (
    <ToastProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
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

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Inner fontsLoaded={fontsLoaded} />
      </AppProvider>
    </SafeAreaProvider>
  );
}
