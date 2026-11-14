import React, { useRef, useState } from 'react';
import { Animated, FlatList, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import UALogo from '../../components/UALogo';
import DoorSign from '../../components/DoorSign';
import { FadeInView, PressableScale } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { gradients, getCategoryColors, MAX_FONT_SCALE } from '../../theme/theme';
import styles from './OnboardingScreen.styles';

const SLIDES = [
  {
    key: 'stores',
    title: 'Order from campus stores',
    text: 'Food, coffee, stationery and printing from the stores you already know on campus.',
  },
  {
    key: 'breaks',
    title: 'Pick your class break',
    text: 'We deliver between classes, never during. Choose the break that fits your schedule.',
  },
  {
    key: 'room',
    title: 'Delivered to your room',
    text: 'Use the real room code on the door sign and we bring it right to you.',
  },
];

const CATEGORY_TILES = [
  { label: 'Food', icon: 'fast-food' },
  { label: 'Drinks', icon: 'cafe' },
  { label: 'Stationery', icon: 'book' },
  { label: 'Printing', icon: 'print' },
];

const BREAKS = ['09:45', '11:15', '12:45'];

// Chapter 16/20: horizontal paging FlatList + Animated dots driven by the scroll position
export default function OnboardingScreen({ navigation }) {
  const { completeOnboarding } = useApp();
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
    navigation.replace('Welcome');
  };

  const goNext = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const renderVisual = (key) => {
    if (key === 'stores') {
      return (
        <View style={styles.tileGrid}>
          {CATEGORY_TILES.map((tile, i) => (
            <FadeInView key={tile.label} delay={120 + i * 80} style={styles.tileWrap}>
              <LinearGradient colors={getCategoryColors(tile.label)} style={styles.tile}>
                <Ionicons name={tile.icon} size={30} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.tileLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{tile.label}</Text>
            </FadeInView>
          ))}
        </View>
      );
    }
    if (key === 'breaks') {
      return (
        <View style={styles.breakCard}>
          <View style={styles.classRow}>
            <Ionicons name="school" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.classText}>Class 08:00–09:45</Text>
          </View>
          {BREAKS.map((time, i) => (
            <View key={time} style={[styles.breakRow, i === 1 && styles.breakRowActive]}>
              <Ionicons name={i === 1 ? 'bicycle' : 'time-outline'} size={18} color={i === 1 ? '#0C2640' : '#FFFFFF'} />
              <Text style={[styles.breakText, i === 1 && styles.breakTextActive]}>Break {time}</Text>
              {i === 1 ? <Text style={styles.breakTag}>Delivery</Text> : null}
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.doorWrap}>
        <DoorSign code="G.2.15" subtitle="Building G · 2nd floor" size="lg" />
      </View>
    );
  };

  const renderSlide = ({ item, index: i }) => (
    <View style={[styles.slide, { width }]}>
      {i === 0 ? <UALogo variant="white" width={150} style={styles.logo} /> : <View style={styles.logoSpacer} />}
      <View style={styles.visual}>{renderVisual(item.key)}</View>
      <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.title}</Text>
      <Text style={styles.text} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.text}</Text>
    </View>
  );

  return (
    <LinearGradient colors={gradients.hero} style={styles.flex}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.flex}>
        <View style={styles.topBar}>
          <PressableScale onPress={finish} accessibilityLabel="Skip onboarding" hitSlop={10} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </PressableScale>
        </View>

        <Animated.FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        />

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((slide, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const scaleX = scrollX.interpolate({ inputRange, outputRange: [1, 3, 1], extrapolate: 'clamp' });
              const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
              return <Animated.View key={slide.key} style={[styles.dot, { opacity, transform: [{ scaleX }] }]} />;
            })}
          </View>
          <AppButton title={isLast ? 'Get started' : 'Next'} variant="accent" icon={isLast ? 'checkmark' : 'arrow-forward'} onPress={goNext} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
