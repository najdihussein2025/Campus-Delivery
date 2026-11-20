import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, interpolate, interpolateColor, runOnJS, useAnimatedReaction, useAnimatedScrollHandler,
  useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import UALogo from '../../components/UALogo';
import CampusBackground from '../../components/CampusBackground';
import DoorSign from '../../components/DoorSign';
import { FadeInView, PressableScale, useReduceMotion } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { fixedColors, getCategoryColors, MAX_FONT_SCALE } from '../../theme/theme';
import { durations, easings, REDUCED_FADE_MS } from '../../theme/motion';
import { createStyles } from './OnboardingScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';

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

// Real UA breaks (see deliverySlots in campus.json); the middle one is highlighted as the delivery
const BREAKS = ['09:45', '11:15', '12:45'];

// One pager dot: widens 8 → 24 and changes colour, interpolated from the scroll position
function PagerDot({ i, scrollX, width }) {
  const styles = useThemedStyles(createStyles);
  const style = useAnimatedStyle(() => {
    const range = [(i - 1) * width, i * width, (i + 1) * width];
    return {
      width: interpolate(scrollX.value, range, [8, 24, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(scrollX.value, range, ['rgba(255,255,255,0.45)', '#00AEEF', 'rgba(255,255,255,0.45)']),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// A break row of slide 2: enters when the slide becomes active (stagger 60 ms); the "Delivery" row then pulses softly
function BreakRow({ time, i, active, reduceMotion }) {
  const styles = useThemedStyles(createStyles);
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const pulse = useSharedValue(1);
  const highlight = i === 1;

  useEffect(() => {
    if (reduceMotion) {
      progress.value = withTiming(active ? 1 : 0, { duration: REDUCED_FADE_MS });
      return;
    }
    progress.value = active ? withDelay(i * 60, withTiming(1, { duration: durations.medium, easing: easings.emphasizedDecel })) : 0;
    if (highlight && active) {
      pulse.value = withDelay(600, withRepeat(withSequence(withTiming(1.04, { duration: 700 }), withTiming(1, { duration: 700 })), 3, false));
    } else {
      pulse.value = 1;
    }
  }, [active, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }, { scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.breakRow, highlight && styles.breakRowActive, style]}>
      <Ionicons name={highlight ? 'bicycle' : 'time-outline'} size={18} color={highlight ? fixedColors.ink : fixedColors.white} />
      <Text style={[styles.breakText, highlight && styles.breakTextActive]}>Break {time}</Text>
      {highlight ? <Text style={styles.breakTag}>Delivery</Text> : null}
    </Animated.View>
  );
}

// One slide. Parallax: the illustration travels at 0.6× the scroll speed (and fades / scales by distance), the text at 1×.
function Slide({ item, i, width, scrollX, activeIndex, reduceMotion }) {
  const styles = useThemedStyles(createStyles);

  const visualStyle = useAnimatedStyle(() => {
    const delta = scrollX.value - i * width; // -width … +width while this slide is on screen
    if (reduceMotion) return { opacity: interpolate(Math.abs(delta), [0, width * 0.6], [1, 0], Extrapolation.CLAMP) };
    return {
      opacity: interpolate(Math.abs(delta), [0, width * 0.7], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: delta * 0.4 }, // content moves with the page (1×) minus 0.4 → the visual lags at 0.6×
        { scale: interpolate(Math.abs(delta), [0, width], [1, 0.9], Extrapolation.CLAMP) },
      ],
    };
  });

  const renderVisual = () => {
    if (item.key === 'stores') {
      return (
        <View style={styles.tileGrid}>
          {/* Not a FlatList: four fixed, decorative tiles in a static grid (the slides themselves are a FlatList) */}
          {CATEGORY_TILES.map((tile, k) => (
            <FadeInView key={tile.label} delay={120 + k * 80} style={styles.tileWrap}>
              <LinearGradient colors={getCategoryColors(tile.label)} style={styles.tile}>
                <Ionicons name={tile.icon} size={30} color={fixedColors.white} />
              </LinearGradient>
              <Text style={styles.tileLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{tile.label}</Text>
            </FadeInView>
          ))}
        </View>
      );
    }
    if (item.key === 'breaks') {
      return (
        <View style={styles.breakCard}>
          <View style={styles.classRow}>
            <Ionicons name="school" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.classText}>Class 08:30–09:45</Text>
          </View>
          {/* Not a FlatList: three fixed, decorative rows of an illustration */}
          {BREAKS.map((time, k) => (
            <BreakRow key={time} time={time} i={k} active={activeIndex === 1} reduceMotion={reduceMotion} />
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

  return (
    <View style={[styles.slide, { width }]}>
      {i === 0 ? <UALogo variant="white" width={150} style={styles.logo} /> : <View style={styles.logoSpacer} />}
      <Animated.View style={[styles.visual, visualStyle]}>{renderVisual()}</Animated.View>
      <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.title}</Text>
      <Text style={styles.text} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.text}</Text>
    </View>
  );
}

// Horizontal paging FlatList. The page index comes from the scroll position (a listener on scrollX), so it is right
// after swipes AND after the programmatic scroll of the Next button (onMomentumScrollEnd does not fire for that on web/Android).
export default function OnboardingScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { completeOnboarding } = useApp();
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const listRef = useRef(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  // Page index = round(x / width), updated from the UI thread only when it changes
  useAnimatedReaction(
    () => Math.round(scrollX.value / width),
    (page, prev) => {
      if (page !== prev && page >= 0 && page < SLIDES.length) runOnJS(setIndex)(page);
    },
    [width]
  );

  const finish = () => {
    completeOnboarding();
    navigation.replace('Welcome');
  };

  const goNext = () => {
    if (isLast) return finish();
    setIndex(index + 1);
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <CampusBackground style={styles.flex}>
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
          renderItem={({ item, index: i }) => (
            <Slide item={item} i={i} width={width} scrollX={scrollX} activeIndex={index} reduceMotion={reduceMotion} />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          extraData={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {/* Not a FlatList: the pager dots are decoration driven by scroll position, not a list of data */}
            {SLIDES.map((slide, i) => (
              <PagerDot key={slide.key} i={i} scrollX={scrollX} width={width} />
            ))}
          </View>
          <AppButton title={isLast ? 'Get started' : 'Next'} variant="accent" icon={isLast ? 'checkmark' : 'arrow-forward'} onPress={goNext} />
        </View>
      </SafeAreaView>
    </CampusBackground>
  );
}
