import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from './Chip';
import ConfirmModal from './ConfirmModal';
import PressableScale from './motion/PressableScale';
import { DIET_TAGS } from '../utils/diet';
import { MAX_FONT_SCALE, fonts, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

// One "Diet" chip (with a count badge when filters are on) that opens a small bottom sheet with the 5 diets.
// Same filter logic as before: multi-select, a product must match ALL selected tags (see utils/diet.js).
export default function DietChip({ selected, onToggle, onClear }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Chip
        label="Diet"
        icon="leaf-outline"
        selected={selected.length > 0}
        count={selected.length || undefined}
        onPress={() => setOpen(true)}
      />
      <ConfirmModal
        visible={open}
        icon="leaf"
        title="Dietary preferences"
        message="Show only products that match all the diets you pick."
        confirmLabel="Done"
        cancelLabel={selected.length ? 'Clear all' : undefined}
        onConfirm={() => setOpen(false)}
        onCancel={selected.length ? () => onClear && onClear() : undefined}
      >
        <FlatList
          data={DIET_TAGS}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          extraData={selected}
          style={{ alignSelf: 'stretch', marginTop: spacing.md }}
          renderItem={({ item }) => {
            const on = selected.includes(item.id);
            return (
              <PressableScale
                onPress={() => onToggle(item.id)}
                accessibilityLabel={`${item.label}${on ? ', selected' : ''}`}
                accessibilityState={{ selected: on }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 48,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: on ? colors.primarySoft : colors.surfaceMuted,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.emoji}</Text>
                <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text }} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {item.label}
                </Text>
                <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? colors.primaryText : colors.textMuted} />
              </PressableScale>
            );
          }}
        />
        <View />
      </ConfirmModal>
    </>
  );
}
