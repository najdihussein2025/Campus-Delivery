import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import StoreMenuScreen from '../screens/home/StoreMenuScreen';
import ProductDetailsScreen from '../screens/home/ProductDetailsScreen';
import PrintScreen from '../screens/print/PrintScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import OrderProcessingScreen from '../screens/cart/OrderProcessingScreen';
import OrderConfirmationScreen from '../screens/cart/OrderConfirmationScreen';
import TrackingScreen from '../screens/orders/TrackingScreen';
import WalletScreen from '../screens/profile/WalletScreen';
import LoyaltyScreen from '../screens/profile/LoyaltyScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import { fonts, MAX_FONT_SCALE } from '../theme/theme';

const Stack = createNativeStackNavigator();

function BookstoreTitle({ children, tintColor }) {
  const { width } = useWindowDimensions();
  return (
    <Text
      style={{ fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 17, color: tintColor, maxWidth: Math.max(100, width - 120) }}
      numberOfLines={2}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      accessibilityRole="header"
    >
      {children}
    </Text>
  );
}

// Header and background colours follow the active theme
const makeScreenOptions = (colors) => ({
  headerStyle: { backgroundColor: colors.headerBg },
  headerTintColor: colors.headerText,
  headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 18 },
  headerShadowVisible: colors.headerBorder !== 'transparent', // dark mode: subtle bottom border
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
          <Stack.Screen
            name="StoreMenu"
            component={StoreMenuScreen}
            options={({ route }) => ({
              title: ({ cafeteria: 'UA Cafeteria', coffee: 'Coffee Corner', bookstore: 'Bookstore & Stationery' })[route.params?.storeId] ?? 'Menu',
              ...(route.params?.storeId === 'bookstore' ? { headerTitle: (props) => <BookstoreTitle {...props} /> } : {}),
            })}
          />
          <Stack.Screen
            name="ProductDetails"
            component={ProductDetailsScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom', headerShown: false }}
          />
          <Stack.Screen name="EditPrintJob" component={PrintScreen} options={{ title: 'Edit print options', presentation: 'modal' }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="OrderProcessing" component={OrderProcessingScreen} options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="Tracking" component={TrackingScreen} options={{ title: 'Track order' }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Campus wallet' }} />
          <Stack.Screen name="Loyalty" component={LoyaltyScreen} options={{ title: 'Coffee Rewards' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
