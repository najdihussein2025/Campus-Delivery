import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StatusBar, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import Chip from '../../components/Chip';
import SectionHeader from '../../components/SectionHeader';
import ConfirmModal from '../../components/ConfirmModal';
import UALogo from '../../components/UALogo';
import DoorSign from '../../components/DoorSign';
import RoomPicker from '../../components/RoomPicker';
import SegmentedControl from '../../components/SegmentedControl';
import DietFilterChips from '../../components/DietFilterChips';
import { FadeInView, PressableScale, ShakeView, StaggerItem, animateLayout, useScreenFocusAnimation, useToast } from '../../components/motion';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/money';
import { formatFloorLong, formatTime, getNow, isValidTime } from '../../utils/time';
import { addDays, dateKey, isValidDateKey, longDayLabel, nextOpenDay, parseKey } from '../../utils/calendar';
import { makeRoomCode, validateRoomParts } from '../../utils/validation';
import { tagLabel } from '../../utils/diet';
import * as haptics from '../../utils/haptics';
import { gradients, MAX_FONT_SCALE } from '../../theme/theme';
import { createStyles } from './ProfileScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';
import { useNetwork } from '../../context/NetworkContext';
import { TRACKING_SPEEDS } from '../../utils/orderStatus';
import { PHOTO_CREDITS } from '../../data/credits';

const EMPTY_ROOM = { buildingId: '', floor: null, roomNumber: '' };
const APP_VERSION = '2.0.0';
const APPEARANCE_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

// Chapter 19: FlatList with header/footer sections, useEffect interval with cleanup for the demo clock
export default function ProfileScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors, mode, setMode } = useTheme();
  const {
    user, wallet, campus, savedLocations, timeOffsetMs, campusBuildings, getBuilding, getCampus,
    formatLocation, updateProfile, addLocation, removeLocation, setDemoTime, setDemoDate, resetDemoTime, logout, loyalty,
    trackingSpeed, setTrackingSpeed, resetDemoData, isDemoAccount,
  } = useApp();
  const { simulateOffline, setSimulateOffline } = useNetwork();
  const { showToast } = useToast();
  const { animatedStyle } = useScreenFocusAnimation();
  const listRef = useRef(null);
  const shakeRef = useRef(null);
  const locationsY = useRef(0);

  const [openSection, setOpenSection] = useState(null);
  const [clock, setClock] = useState(formatTime(getNow(timeOffsetMs)));
  const [demoInput, setDemoInput] = useState('');
  const [demoError, setDemoError] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState('');
  const [room, setRoom] = useState(EMPTY_ROOM);
  const [locationErrors, setLocationErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    setClock(formatTime(getNow(timeOffsetMs)));
    const timer = setInterval(() => setClock(formatTime(getNow(timeOffsetMs))), 30000);
    return () => clearInterval(timer);
  }, [timeOffsetMs]);

  const currentCampus = getCampus();

  const toggleSection = (key) => {
    animateLayout();
    setOpenSection(openSection === key ? null : key);
  };

  const scrollToLocations = () => {
    listRef.current?.scrollToOffset({ offset: Math.max(0, locationsY.current - 8), animated: true });
  };

  const handleSetTime = () => {
    if (!isValidTime(demoInput)) {
      setDemoError('Use the HH:MM format, e.g. 11:00');
      haptics.error();
      return;
    }
    setDemoError('');
    setDemoTime(demoInput);
    setDemoInput('');
    showToast({ message: `App time set to ${demoInput}`, icon: 'time', tone: 'success' });
  };

  // Demo date: quick buttons set the date and 11:00, so stores and breaks are visible right away
  const applyDate = (dateStr, hhmm) => {
    setDateError('');
    setDateInput('');
    setDemoDate(dateStr, hhmm);
    showToast({ message: `Demo date: ${longDayLabel(parseKey(dateStr))}`, icon: 'calendar', tone: 'success' });
  };

  const handleSetDate = () => {
    if (!isValidDateKey(dateInput.trim())) {
      setDateError('Use the YYYY-MM-DD format, e.g. 2026-12-28');
      haptics.error();
      return;
    }
    applyDate(dateInput.trim());
  };

  const quickDates = () => {
    const today = getNow(timeOffsetMs);
    // nextOpenDay is capped at 730 days: null when the calendar has no later open day (the button is hidden then)
    const weekday = nextOpenDay(today);
    const saturday = addDays(today, (6 - today.getDay() + 7) % 7 || 7);
    return [
      ...(weekday ? [{ id: 'weekday', label: 'Next weekday', date: dateKey(weekday) }] : []),
      { id: 'saturday', label: 'A Saturday', date: dateKey(saturday) },
      { id: 'christmas', label: 'Christmas break', date: '2026-12-28' },
      { id: 'independence', label: 'Independence Day (23 Nov)', date: '2026-11-23' },
    ];
  };

  const handleReset = () => {
    setDemoError('');
    setDateError('');
    setDateInput('');
    setDemoInput('');
    resetDemoTime();
    showToast({ message: 'Back to the real time', icon: 'refresh' });
  };

  // My diet: default dietary filters, saved on the user's account
  const toggleMyDiet = (tag) => {
    const current = user.myDiet || [];
    animateLayout();
    haptics.tap();
    updateProfile({ myDiet: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag] });
  };

  const handleResetDemo = async () => {
    setShowReset(false);
    await resetDemoData();
    haptics.success();
    showToast({ message: 'Demo data reset: 12 orders, card at 8/10', icon: 'refresh', tone: 'success' });
  };

  const handleCampus = (campusId) => {
    if (campusId === user.campusId) return;
    animateLayout();
    updateProfile({ campusId });
    haptics.tap();
    showToast({ message: `Campus changed to ${getCampus(campusId)?.name}`, icon: 'location', tone: 'success' });
  };

  const toggleAdd = () => {
    animateLayout();
    setShowAdd(!showAdd);
    setLocationErrors({});
    setRoom(EMPTY_ROOM);
    setLabel('');
  };

  const handleAddLocation = () => {
    const errors = validateRoomParts(room);
    if (!label.trim()) errors.label = 'Give this place a name, e.g. "My Lab"';
    setLocationErrors(errors);
    if (Object.keys(errors).length) {
      shakeRef.current?.shake();
      return;
    }
    const building = getBuilding(room.buildingId);
    addLocation({ label, buildingId: room.buildingId, room: makeRoomCode(building.code, room.floor, room.roomNumber) });
    animateLayout();
    setShowAdd(false);
    setRoom(EMPTY_ROOM);
    setLabel('');
    haptics.success();
    showToast({ message: 'Location saved', icon: 'bookmark', tone: 'success' });
  };

  const handleDelete = () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    animateLayout();
    removeLocation(target.id);
    haptics.warning();
    showToast({ message: `"${target.label}" removed`, icon: 'trash' });
  };

  const header = (
    <View>
      <FadeInView>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{getInitials(user.name)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{user.name}</Text>
              <Text style={styles.email} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <HeroItem icon="school-outline" label="Faculty" value={user.faculty} />
            <HeroItem icon="location-outline" label="Campus" value={currentCampus ? `${currentCampus.name} · ${currentCampus.subtitle}` : '—'} />
            <View style={styles.heroRow}>
              <HeroItem icon="card-outline" label="ID" value={user.studentId} half />
              <HeroItem icon="call-outline" label="Phone" value={user.phone} half />
            </View>
          </View>
        </LinearGradient>
      </FadeInView>

      <SectionHeader title="Account" />
      <Card style={styles.menu}>
        <MenuRow icon="wallet" label="Campus wallet" value={formatMoney(wallet.balance)} onPress={() => navigation.navigate('Wallet')} />
        <View style={styles.divider} />
        <MenuRow
          icon="cafe"
          label="Coffee stamps"
          value={loyalty.rewards > 0 ? '🎁 Free coffee' : `${loyalty.stamps} / 10`}
          onPress={() => navigation.navigate('Loyalty')}
        />
        <View style={styles.divider} />
        <MenuRow icon="notifications" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <View style={styles.divider} />
        <MenuRow
          icon="business"
          label="Campus"
          value={currentCampus?.name}
          open={openSection === 'campus'}
          onPress={() => toggleSection('campus')}
        />
        {openSection === 'campus' ? (
          <View style={styles.expand}>
            <FlatList
              data={campus.campuses}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <Chip
                  label={item.name}
                  subtitle={item.subtitle}
                  icon="location-outline"
                  selected={user.campusId === item.id}
                  onPress={() => handleCampus(item.id)}
                />
              )}
            />
            <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>Checkout shows the buildings of your campus.</Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Preferences" />
      <Card style={styles.menu}>
        <MenuRow
          icon="leaf"
          label="My diet"
          value={(user.myDiet || []).length ? (user.myDiet || []).map(tagLabel).join(', ') : 'None'}
          open={openSection === 'diet'}
          onPress={() => toggleSection('diet')}
        />
        {openSection === 'diet' ? (
          <View style={styles.expand}>
            <DietFilterChips selected={user.myDiet || []} onToggle={toggleMyDiet} />
            <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              These filters are turned on when you open a menu. You can remove them for a single visit.
            </Text>
          </View>
        ) : null}
        <View style={styles.divider} />
        <MenuRow
          icon="contrast"
          label="Appearance"
          value={APPEARANCE_LABELS[mode]}
          open={openSection === 'appearance'}
          onPress={() => toggleSection('appearance')}
        />
        {openSection === 'appearance' ? (
          <View style={styles.expand}>
            <SegmentedControl
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
              value={mode}
              onChange={setMode}
            />
            <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>System follows your phone's dark mode setting.</Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Demo" />
      <Card style={styles.menu}>
        <MenuRow
          icon="time"
          label="Demo settings"
          value={timeOffsetMs !== 0 ? `${longDayLabel(getNow(timeOffsetMs))} ${clock} · demo` : clock}
          open={openSection === 'demo'}
          onPress={() => toggleSection('demo')}
        />
        {openSection === 'demo' ? (
          <View style={styles.expand}>
            <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Set the app clock for a live demo (e.g. 11:00 so stores are open and breaks are available). Set time keeps the demo date; Reset returns to the real date and time.
            </Text>
            <AppInput
              placeholder="HH:MM, e.g. 11:00"
              icon="alarm-outline"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              returnKeyType="done"
              onSubmitEditing={handleSetTime}
              value={demoInput}
              onChangeText={setDemoInput}
              error={demoError}
              style={styles.demoInput}
            />
            <View style={styles.demoButtons}>
              <AppButton title="Set time" small onPress={handleSetTime} style={styles.flex} />
              <AppButton title="Reset" small variant="secondary" onPress={handleReset} style={[styles.flex, styles.resetButton]} />
            </View>

            <Text style={styles.subLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Demo date (weekends and holidays close UA)</Text>
            <AppInput
              placeholder="YYYY-MM-DD, e.g. 2026-12-28"
              icon="calendar-outline"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSetDate}
              value={dateInput}
              onChangeText={setDateInput}
              error={dateError}
              style={styles.demoInput}
            />
            <FlatList
              data={quickDates()}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              style={styles.quickDates}
              renderItem={({ item }) => <Chip label={item.label} icon="calendar" onPress={() => applyDate(item.date, '11:00')} />}
            />
            <View style={styles.demoButtons}>
              <AppButton title="Set date" small onPress={handleSetDate} style={styles.flex} />
              <AppButton title="Reset" small variant="secondary" onPress={handleReset} style={[styles.flex, styles.resetButton]} />
            </View>

            <Text style={styles.subLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Tracking speed (new orders)</Text>
            <SegmentedControl
              options={TRACKING_SPEEDS.map((s) => ({ value: s.id, label: s.label, subtitle: `${s.seconds} s per step` }))}
              value={trackingSpeed}
              onChange={setTrackingSpeed}
            />
            <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Demo (20 s) leaves time to lock the phone and watch the notifications arrive.
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Simulate offline</Text>
                <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>Shows the offline banner without turning off Wi-Fi.</Text>
              </View>
              <Switch
                value={simulateOffline}
                onValueChange={setSimulateOffline}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
                accessibilityLabel="Simulate offline"
              />
            </View>

            {isDemoAccount ? (
              <AppButton
                title="Reset demo data"
                icon="refresh"
                small
                variant="secondary"
                onPress={() => setShowReset(true)}
                style={styles.resetData}
              />
            ) : null}
          </View>
        ) : null}
      </Card>

      <SectionHeader title="About" />
      <Card style={styles.menu}>
        <MenuRow icon="information-circle" label="About CampusGo" open={openSection === 'about'} onPress={() => toggleSection('about')} />
        {openSection === 'about' ? (
          <View style={styles.expand}>
            <UALogo variant="blue" width={140} style={styles.aboutLogo} />
            <Text style={styles.aboutTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>CampusGo · v{APP_VERSION}</Text>
            <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              Mobile Development course project – Université Antonine. Campus deliveries between classes.
            </Text>
            <AppButton
              title={showCredits ? 'Hide photo credits' : 'Photo credits'}
              icon="images-outline"
              small
              variant="secondary"
              onPress={() => {
                animateLayout();
                setShowCredits(!showCredits);
              }}
              style={styles.resetData}
            />
            {showCredits ? (
              <FlatList
                data={PHOTO_CREDITS}
                scrollEnabled={false}
                keyExtractor={(item) => item.file}
                renderItem={({ item }) => (
                  <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {item.subject}: “{item.title}” by {item.author} · {item.license}
                  </Text>
                )}
              />
            ) : null}
          </View>
        ) : null}
      </Card>

      <View onLayout={(e) => (locationsY.current = e.nativeEvent.layout.y)}>
        <SectionHeader title="Saved locations" actionLabel={showAdd ? 'Close' : '+ Add'} onAction={toggleAdd} />
      </View>

      {showAdd ? (
        <FadeInView>
          <ShakeView ref={shakeRef}>
            <Card style={styles.addCard}>
              <AppInput
                label="Name"
                icon="bookmark-outline"
                placeholder="e.g. My Lab"
                value={label}
                onChangeText={setLabel}
                error={locationErrors.label}
              />
              <RoomPicker buildings={campusBuildings} value={room} onChange={setRoom} errors={locationErrors} />
              <AppButton title="Save location" icon="checkmark" onPress={handleAddLocation} style={styles.saveButton} />
            </Card>
          </ShakeView>
        </FadeInView>
      ) : null}
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      {/* Outlined danger button (not a solid red block); the ConfirmModal below asks before logging out */}
      <AppButton title="Log out" icon="log-out-outline" variant="dangerOutline" onPress={() => setShowLogout(true)} />
      <UALogo variant="blue" width={120} style={styles.footerLogo} />
      <Text style={styles.version} maxFontSizeMultiplier={MAX_FONT_SCALE}>CampusGo v{APP_VERSION} · Université Antonine</Text>
    </View>
  );

  const renderLocation = ({ item, index }) => {
    const building = getBuilding(item.buildingId);
    const parts = item.room.split('.');
    const floorText = parts.length === 3 ? formatFloorLong(parseInt(parts[1], 10)) : '';
    return (
      <StaggerItem index={index}>
        <View style={styles.locationCard}>
          <DoorSign code={item.room} size="sm" />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.label}</Text>
            <Text style={styles.locationDetail} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>
              {building ? `${building.name}${floorText ? ` · ${floorText}` : ''}` : formatLocation(item.buildingId, item.room)}
            </Text>
          </View>
          <PressableScale
            onPress={() => setDeleteTarget(item)}
            accessibilityLabel={`Delete ${item.label}`}
            hitSlop={8}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={19} color={colors.dangerText} />
          </PressableScale>
        </View>
      </StaggerItem>
    );
  };

  return (
    <Animated.View style={[styles.screen, animatedStyle]}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={listRef}
        data={savedLocations}
        keyExtractor={(item) => item.id}
        renderItem={renderLocation}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          showAdd ? null : (
            <PressableScale onPress={toggleAdd} accessibilityLabel="Add a saved location" style={styles.emptyCard}>
              <Ionicons name="add-circle-outline" size={22} color={colors.primaryText} />
              <Text style={styles.emptyText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Add your lab or classroom for one-tap checkout.
              </Text>
            </PressableScale>
          )
        }
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete location?"
        message={deleteTarget ? `"${deleteTarget.label}" (${deleteTarget.room}) will be removed from your saved places.` : ''}
        icon="trash"
        tone="danger"
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        visible={showReset}
        title="Reset demo data?"
        message="Orders, wallet and stamps go back to the demo starting point: 3 weeks of orders and a card at 8/10."
        icon="refresh"
        tone="warning"
        confirmLabel="Reset"
        onCancel={() => setShowReset(false)}
        onConfirm={handleResetDemo}
      />

      <ConfirmModal
        visible={showLogout}
        title="Log out?"
        message="Your bag, wallet and orders stay saved on this phone."
        icon="log-out"
        tone="danger"
        confirmLabel="Log out"
        onCancel={() => setShowLogout(false)}
        onConfirm={() => {
          setShowLogout(false);
          logout();
        }}
      />
    </Animated.View>
  );
}

function HeroItem({ icon, label, value, half }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.heroItem, half && styles.heroItemHalf]}>
      <Ionicons name={icon} size={16} color="rgba(255,255,255,0.75)" />
      <View style={styles.heroItemText}>
        <Text style={styles.heroLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
        <Text style={styles.heroValue} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon, label, value, onPress, open }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} scaleTo={0.98} style={styles.menuRow}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={19} color={colors.primaryText} />
      </View>
      <Text style={styles.menuLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text>
      {value ? (
        <Text style={styles.menuValue} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
      ) : null}
      <Ionicons
        name={open === undefined ? 'chevron-forward' : open ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={colors.textMuted}
      />
    </PressableScale>
  );
}
