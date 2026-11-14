import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/theme';

const Stack = createNativeStackNavigator();

// Onboarding is shown only on first launch (flag saved in AsyncStorage)
export default function AuthStack() {
  const { onboardingDone } = useApp();
  return (
    <Stack.Navigator
      initialRouteName={onboardingDone ? 'Welcome' : 'Onboarding'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
