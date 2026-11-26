import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from './AppInput';
import Chip from './Chip';
import DoorSign from './DoorSign';
import PressableScale from './motion/PressableScale';
import { animateLayout } from './motion/layout';
import { MAX_FONT_SCALE } from '../theme/theme';
import { formatFloor, formatFloorLong } from '../utils/time';
import { makeRoomCode } from '../utils/validation';
import { createStyles } from './RoomPicker.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Guided room input in the real UA format Building.Floor.Room with a live door-sign preview
export default function RoomPicker({ buildings = [], value, onChange, errors = {}, compact = false, resetRoomOnBuildingChange = false }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { buildingId, floor, roomNumber } = value;
  const building = buildings.find((b) => b.id === buildingId);
  const floors = building ? building.floors : [];
  const roomValid = /^\d{1,2}$/.test(roomNumber || '') && parseInt(roomNumber, 10) >= 1;
  const preview = building && floor !== null && floor !== undefined && roomValid
    ? makeRoomCode(building.code, floor, roomNumber)
    : `${building ? building.code : '?'}.${floor !== null && floor !== undefined ? floor : '?'}.${roomValid ? parseInt(roomNumber, 10) : '?'}`;

  const selectBuilding = (b) => {
    if (b.id === buildingId) return;
    animateLayout();
    const keepFloor = b.floors.includes(floor) ? floor : null;
    onChange(resetRoomOnBuildingChange
      ? { buildingId: b.id, floor: null, roomNumber: '' }
      : { ...value, buildingId: b.id, floor: keepFloor });
  };

  const renderBuilding = ({ item }) => {
    const selected = item.id === buildingId;
    return (
      <PressableScale
        onPress={() => selectBuilding(item)}
        accessibilityLabel={`${item.name}, ${item.landmarks}`}
        accessibilityState={{ selected }}
        style={[styles.building, compact && styles.compactBuilding, selected && styles.buildingSelected]}
      >
        <View style={[styles.codeCircle, compact && styles.compactCode, selected && styles.codeCircleSelected]}>
          <Text style={[styles.codeText, selected && styles.codeTextSelected]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {item.code}
          </Text>
        </View>
        <Text style={styles.buildingName} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.name}</Text>
        <Text style={styles.landmarks} numberOfLines={2} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.landmarks}</Text>
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primaryText} />
          </View>
        ) : null}
      </PressableScale>
    );
  };

  return (
    <View>
      <Text style={styles.stepLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>1 · Building</Text>
      <FlatList
        data={buildings}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderBuilding}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.buildingList}
      />
      {errors.building ? <Text style={styles.error} maxFontSizeMultiplier={MAX_FONT_SCALE}>{errors.building}</Text> : null}

      <Text style={styles.stepLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>2 · Floor</Text>
      {building ? (
        <FlatList
          data={floors}
          horizontal
          keyExtractor={(item) => String(item)}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              label={formatFloor(item)}
              selected={floor === item}
              onPress={() => {
                animateLayout();
                onChange({ ...value, floor: item });
              }}
            />
          )}
        />
      ) : (
        <Text style={styles.hint} maxFontSizeMultiplier={MAX_FONT_SCALE}>Choose a building first</Text>
      )}
      {errors.floor ? <Text style={styles.error} maxFontSizeMultiplier={MAX_FONT_SCALE}>{errors.floor}</Text> : null}

      <Text style={styles.stepLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>3 · Room number</Text>
      <View style={styles.roomRow}>
        <AppInput
          icon="keypad-outline"
          placeholder="e.g. 15"
          keyboardType="number-pad"
          value={roomNumber}
          onChangeText={(text) => onChange({ ...value, roomNumber: text })}
          error={errors.room}
          style={styles.roomInput}
          accessibilityLabel="Room number"
        />
        <View style={styles.preview}>
          <DoorSign
            code={preview}
            subtitle={building ? `${building.name}${floor !== null && floor !== undefined ? ` · ${formatFloorLong(floor)}` : ''}` : 'Your room'}
            size="md"
          />
        </View>
      </View>
    </View>
  );
}
