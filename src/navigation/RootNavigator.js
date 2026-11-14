import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import StoreMenuScreen from '../screens/home/StoreMenuScreen';
import ProductDetailsScreen from '../screens/home/ProductDetailsScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import TrackingScreen from '../screens/orders/TrackingScreen';
import WalletScreen from '../screens/profile/WalletScreen';
import LoyaltyScreen from '../screens/profile/LoyaltyScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import { fonts } from '../theme/theme';

const Stack = createNativeStackNavigator();

// Header and background colours follow the active theme
const makeScreenOptions = (colors) => ({
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.textOnDark,
  headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 18 },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right',
});

// Chapter 18: conditional rendering switches between the auth and app navigators
export default function RootNavigator() {
  const { user } = useApp();
  const { colors } = useTheme();

  return (
    <Stack.Navigator screenOptions={makeScreenOptions(colors)}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false, animation: 'fade' }} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="StoreMenu" component={StoreMenuScreen} options={{ title: 'Menu' }} />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom', headerShown: false }}
          />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Track order' }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Campus wallet' }} />
          <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ title: 'Coffee stamps' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
