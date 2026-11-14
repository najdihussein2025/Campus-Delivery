import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Chip from '../../components/Chip';
import UALogo from '../../components/UALogo';
import StepIndicator from '../../components/StepIndicator';
import { AnimatedProgressBar, FadeInView, PressableScale, ShakeView, animateLayout } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { normalizeEmail, passwordStrength, validateSignUp } from '../../utils/validation';
import { colors, MAX_FONT_SCALE } from '../../theme/theme';
import styles from './SignUpScreen.styles';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  confirm: '',
  studentId: '',
  faculty: '',
  campusId: 'baabda',
  phone: '',
};

const STEP_FIELDS = [
  ['name', 'email', 'password', 'confirm'],
  ['studentId', 'faculty', 'phone'],
];

const STRENGTH_COLORS = [colors.danger, colors.danger, colors.warning, colors.accent, colors.success];

const pick = (errors, fields) => {
  const result = {};
  fields.forEach((f) => {
    if (errors[f]) result[f] = errors[f];
  });
  return result;
};

// Chapter 17: a 2-step form with one state object, refs for "next" focus and per-step validation
export default function SignUpScreen({ navigation }) {
  const { campus, users, signUp } = useApp();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const shakeRef = useRef(null);
  const scrollRef = useRef(null);
  const refs = {
    name: useRef(null),
    email: useRef(null),
    password: useRef(null),
    confirm: useRef(null),
    studentId: useRef(null),
    phone: useRef(null),
  };

  const update = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const strength = passwordStrength(form.password);

  const fullForm = () => ({ ...form, email: normalizeEmail(form.email) });

  // Validate one field when it loses focus (only if the user typed something)
  const checkField = (field) => () => {
    if (field === 'email' && form.email) update('email')(normalizeEmail(form.email));
    if (!form[field]) return;
    const found = validateSignUp(fullForm(), users);
    setErrors((prev) => ({ ...prev, [field]: found[field] }));
  };

  const validateStep = (index) => {
    const found = pick(validateSignUp(fullForm(), users), STEP_FIELDS[index]);
    setErrors(found);
    if (Object.keys(found).length) {
      shakeRef.current?.shake();
      const first = STEP_FIELDS[index].find((f) => found[f]);
      if (refs[first]?.current) refs[first].current.focus();
      else scrollRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(0)) return;
    update('email')(normalizeEmail(form.email));
    animateLayout();
    setStep(1);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBack = () => {
    if (step === 0) return navigation.goBack();
    animateLayout();
    setErrors({});
    setStep(0);
  };

  const handleSignUp = async () => {
    if (!validateStep(0)) {
      setStep(0);
      return;
    }
    if (!validateStep(1)) return;
    setLoading(true);
    await signUp(fullForm());
  };

  const accountStep = (
    <FadeInView key="account">
      <AppInput
        ref={refs.name}
        label="Full name"
        icon="person-outline"
        placeholder="e.g. Rami Khoury"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => refs.email.current?.focus()}
        onBlur={checkField('name')}
        value={form.name}
        onChangeText={update('name')}
        error={errors.name}
      />
      <AppInput
        ref={refs.email}
        label="University email"
        icon="mail-outline"
        placeholder="your.name"
        suffix={form.email.includes('@') ? undefined : '@ua.edu.lb'}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => refs.password.current?.focus()}
        onBlur={checkField('email')}
        value={form.email}
        onChangeText={update('email')}
        error={errors.email}
      />
      <AppInput
        ref={refs.password}
        label="Password"
        icon="lock-closed-outline"
        placeholder="At least 6 characters"
        secure
        autoComplete="password-new"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => refs.confirm.current?.focus()}
        onBlur={checkField('password')}
        value={form.password}
        onChangeText={update('password')}
        error={errors.password}
        style={styles.passwordInput}
      />
      {form.password ? (
        <View style={styles.strength}>
          <AnimatedProgressBar progress={Math.max(0.08, strength.score / 4)} color={STRENGTH_COLORS[strength.score]} height={6} style={styles.strengthBar} />
          <Text style={[styles.strengthLabel, { color: strength.score >= 3 ? colors.success : colors.textMuted }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {strength.label}
          </Text>
        </View>
      ) : (
        <View style={styles.strengthSpacer} />
      )}
      <AppInput
        ref={refs.confirm}
        label="Confirm password"
        icon="shield-checkmark-outline"
        placeholder="Repeat your password"
        secure
        returnKeyType="next"
        onSubmitEditing={handleNext}
        onBlur={checkField('confirm')}
        value={form.confirm}
        onChangeText={update('confirm')}
        error={errors.confirm}
      />
      <AppButton title="Next" icon="arrow-forward" onPress={handleNext} style={styles.button} />
    </FadeInView>
  );

  const studentStep = (
    <FadeInView key="student">
      <AppInput
        ref={refs.studentId}
        label="Student / staff ID"
        icon="card-outline"
        placeholder="8 digits"
        keyboardType="number-pad"
        maxLength={8}
        returnKeyType="next"
        onSubmitEditing={() => refs.phone.current?.focus()}
        onBlur={checkField('studentId')}
        value={form.studentId}
        onChangeText={update('studentId')}
        error={errors.studentId}
      />

      <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_SCALE}>Faculty</Text>
      <FlatList
        data={campus.faculties}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <Chip
            label={item.replace('Faculty of ', '')}
            selected={form.faculty === item}
            onPress={() => {
              update('faculty')(item);
              setErrors((prev) => ({ ...prev, faculty: undefined }));
            }}
          />
        )}
      />
      {errors.faculty ? <Text style={styles.error}>{errors.faculty}</Text> : null}

      <Text style={[styles.label, styles.afterChips]} maxFontSizeMultiplier={MAX_FONT_SCALE}>Campus</Text>
      <FlatList
        data={campus.campuses}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <Chip
            label={item.name}
            subtitle={item.subtitle}
            icon="location-outline"
            selected={form.campusId === item.id}
            onPress={() => {
              animateLayout();
              update('campusId')(item.id);
            }}
          />
        )}
      />

      <AppInput
        ref={refs.phone}
        label="Phone"
        icon="call-outline"
        placeholder="71123456"
        keyboardType="phone-pad"
        maxLength={8}
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="done"
        onBlur={checkField('phone')}
        value={form.phone}
        onChangeText={update('phone')}
        error={errors.phone}
        style={styles.afterChips}
      />

      <View style={styles.row}>
        <AppButton title="Back" variant="secondary" onPress={handleBack} style={styles.backButton} />
        <AppButton title="Create account" icon="checkmark" onPress={handleSignUp} loading={loading} style={styles.flex} />
      </View>
    </FadeInView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <PressableScale onPress={handleBack} accessibilityLabel="Go back" style={styles.back}>
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </PressableScale>
            <UALogo variant="blue" width={120} />
          </View>

          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>Create account</Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Get a <Text style={styles.highlight}>$10.00 welcome credit</Text> in your wallet.
          </Text>

          <StepIndicator
            steps={['Account', 'Student info']}
            current={step}
            completed={[step > 0, false]}
            onStepPress={(i) => (i === 0 ? handleBack() : handleNext())}
            style={styles.steps}
          />

          <ShakeView ref={shakeRef}>{step === 0 ? accountStep : studentStep}</ShakeView>

          <View style={styles.footer}>
            <Text style={styles.footerText} maxFontSizeMultiplier={MAX_FONT_SCALE}>Already have an account? </Text>
            <PressableScale onPress={() => navigation.navigate('Login')} hitSlop={12} accessibilityLabel="Log in">
              <Text style={styles.link} maxFontSizeMultiplier={MAX_FONT_SCALE}>Log in</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
