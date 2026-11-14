import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import TabIcon from './TabIcon';
import HomeScreen from '../screens/home/HomeScreen';
import PrintScreen from '../screens/print/PrintScreen';
import CartScreen from '../screens/cart/CartScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { fonts, shadow } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: 'home',
  Print: 'print',
  Cart: 'bag-handle',
  Orders: 'receipt',
  Profile: 'person',
};

// Chapter 18: bottom tabs with screenOptions; animated icons and a bumping bag badge
export default function MainTabs() {
  const { colors } = useTheme();
  const { cartTotals } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnDark,
        headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 18 },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11.5 },
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          height: 66 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 6,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          ...shadow.raised,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon
            name={ICONS[route.name]}
            focused={focused}
            color={color}
            size={size - 1}
            badge={route.name === 'Cart' ? cartTotals.count : 0}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Print" component={PrintScreen} options={{ title: 'Print' }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Your bag',
          tabBarLabel: 'Bag',
          tabBarAccessibilityLabel: cartTotals.count ? `Bag, ${cartTotals.count} items` : 'Bag',
        }}
      />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'My orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
