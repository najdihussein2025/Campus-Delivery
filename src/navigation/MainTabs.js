import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import useReduceMotion from '../components/motion/useReduceMotion';
import { springs, REDUCED_FADE_MS } from '../theme/motion';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: 'home',
  Print: 'print',
  Cart: 'bag-handle',
  Orders: 'receipt',
  Profile: 'person',
};

// The 22 px indicator above the active tab slides from tab to tab (one shared translateX, UI thread)
function SlidingTabBar(props) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = React.useState(0);
  const count = props.state.routes.length;
  const x = useSharedValue(0);
  const slot = width / count;
  const target = props.state.index * slot + (slot - 22) / 2;
  React.useEffect(() => {
    if (!width) return;
    x.value = reduceMotion ? withTiming(target, { duration: REDUCED_FADE_MS }) : withSpring(target, springs.snappy);
  }, [target, width, reduceMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <BottomTabBar {...props} />
      {width > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.indicator, { backgroundColor: colors.primaryText }, style]} />
      ) : null}
    </View>
  );
}

// Chapter 18: bottom tabs with screenOptions; animated icons and a bumping bag badge
export default function MainTabs() {
  const { colors } = useTheme();
  const { cartTotals } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBar={(props) => <SlidingTabBar {...props} />}
      screenOptions={({ route }) => ({
        animation: 'fade', // 150 ms cross-fade when switching tabs
        headerStyle: { backgroundColor: colors.headerBg, borderBottomWidth: 1, borderBottomColor: colors.headerBorder },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontFamily: fonts.extrabold, fontSize: 18 },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11.5, lineHeight: 16, paddingBottom: 2 },
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          height: 74 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 8,
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
            flyTarget={route.name === 'Cart'}
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

const styles = StyleSheet.create({
  indicator: { position: 'absolute', top: 0, left: 0, width: 22, height: 3, borderRadius: 2 },
});
