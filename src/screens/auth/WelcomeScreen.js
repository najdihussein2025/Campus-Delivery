import React from 'react';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CampusBackground from '../../components/CampusBackground';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import UALogo from '../../components/UALogo';
import { FadeInView, PressableScale } from '../../components/motion';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { createStyles } from './WelcomeScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const POINTS = [
  { icon: 'flash', text: 'Order in seconds' },
  { icon: 'location', text: 'Delivered to your room' },
  { icon: 'wallet', text: 'Pay with your campus wallet' },
];

// Chapter 18: stack navigation with navigation.navigate and route params
export default function WelcomeScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <CampusBackground style={styles.gradient}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.glow} />
        <View style={styles.top}>
          <FadeInView>
            <UALogo variant="white" width={170} style={styles.logo} />
          </FadeInView>
          <FadeInView delay={120}>
            <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Campus<Text style={styles.titleAccent}>Go</Text>
            </Text>
            <Text style={styles.by} maxFontSizeMultiplier={MAX_FONT_SCALE}>by Université Antonine</Text>
            <Text style={styles.tagline} maxFontSizeMultiplier={MAX_FONT_SCALE}>Your campus, delivered between classes.</Text>
          </FadeInView>

          <View style={styles.points}>
            {/* Not a FlatList: three fixed selling points in a static layout block */}
            {POINTS.map((point, i) => (
              <FadeInView key={point.text} delay={240 + i * 80} style={styles.point}>
                <View style={styles.pointIcon}>
                  <Ionicons name={point.icon} size={18} color={colors.accent} />
                </View>
                <Text style={styles.pointText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{point.text}</Text>
              </FadeInView>
            ))}
          </View>
        </View>

        <FadeInView delay={480} style={styles.bottom}>
          <AppButton title="Log in" variant="accent" onPress={() => navigation.navigate('Login')} />
          <AppButton title="Create account" variant="secondary" onPress={() => navigation.navigate('SignUp')} style={styles.secondary} />

          <PressableScale
            onPress={() => navigation.navigate('Login', { demo: true })}
            accessibilityLabel="Use the demo account"
            style={styles.demoCard}
          >
            <Ionicons name="sparkles" size={18} color={colors.accentWarm} />
            <View style={styles.demoTextWrap}>
              <Text style={styles.demoTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Use demo account</Text>
              <Text style={styles.demoText} maxFontSizeMultiplier={MAX_FONT_SCALE}>student@ua.edu.lb · campus123</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textOnDark} />
          </PressableScale>
        </FadeInView>
      </SafeAreaView>
    </CampusBackground>
  );
}
