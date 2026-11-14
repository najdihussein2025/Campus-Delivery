import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import UALogo from '../../components/UALogo';
import { FadeInView, PressableScale, ShakeView } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { normalizeEmail, validateLogin } from '../../utils/validation';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { createStyles } from './LoginScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const DEMO = { email: 'student@ua.edu.lb', password: 'campus123' };

// Chapter 17: controlled TextInputs, refs to move focus, validation on blur and on submit
export default function LoginScreen({ navigation, route }) {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const { users, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);
  const shakeRef = useRef(null);

  // Prefill when coming from "Use demo account"
  useEffect(() => {
    if (route.params?.demo) {
      setEmail(DEMO.email);
      setPassword(DEMO.password);
    }
  }, [route.params?.demo]);

  const checkEmail = () => {
    if (!email) return;
    const value = normalizeEmail(email);
    setEmail(value);
    const found = validateLogin({ email: value, password: 'xxxxxx' }, users);
    setErrors((prev) => ({ ...prev, email: found.email }));
  };

  const checkPassword = () => {
    if (!password) return;
    setErrors((prev) => ({ ...prev, password: password.length < 6 ? 'Password must be at least 6 characters' : undefined }));
  };

  const handleLogin = async () => {
    const value = normalizeEmail(email);
    setEmail(value);
    const found = validateLogin({ email: value, password }, users);
    setErrors(found);
    if (Object.keys(found).length) {
      shakeRef.current?.shake();
      if (found.email) emailRef.current?.focus();
      else passwordRef.current?.focus();
      return;
    }
    setLoading(true);
    await login(value);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <PressableScale onPress={() => navigation.goBack()} accessibilityLabel="Go back" style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
          </PressableScale>

          <FadeInView>
            <UALogo variant="blue" width={150} style={styles.logo} />
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>Welcome back</Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Log in with your university account.</Text>
          </FadeInView>

          <FadeInView delay={120}>
            <ShakeView ref={shakeRef} style={styles.form}>
              <AppInput
                ref={emailRef}
                label="University email"
                icon="mail-outline"
                placeholder="your.name"
                suffix={email.includes('@') ? undefined : '@ua.edu.lb'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                onBlur={checkEmail}
                value={email}
                onChangeText={setEmail}
                error={errors.email}
              />
              <AppInput
                ref={passwordRef}
                label="Password"
                icon="lock-closed-outline"
                placeholder="At least 6 characters"
                secure
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                onBlur={checkPassword}
                value={password}
                onChangeText={setPassword}
                error={errors.password}
              />
              <AppButton title="Log in" icon="log-in-outline" onPress={handleLogin} loading={loading} style={styles.button} />
            </ShakeView>
          </FadeInView>

          <View style={styles.footer}>
            <Text style={styles.footerText} maxFontSizeMultiplier={MAX_FONT_SCALE}>New to CampusGo? </Text>
            <PressableScale onPress={() => navigation.navigate('SignUp')} hitSlop={12} accessibilityLabel="Create account">
              <Text style={styles.link} maxFontSizeMultiplier={MAX_FONT_SCALE}>Create account</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
