import React, { useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Chip from './Chip';
import ConfirmModal from './ConfirmModal';
import PressableScale from './motion/PressableScale';
import BumpBadge from './motion/BumpBadge';
import { DIET_TAGS } from '../utils/diet';
import { MAX_FONT_SCALE, fonts, radius, spacing } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import useThemedStyles from '../hooks/useThemedStyles';

const createStyles = (c) => StyleSheet.create({
  iconButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  active: { backgroundColor: c.primarySoft, borderColor: c.primary },
  count: { position: 'absolute', top: -3, right: -3 },
});

export default function DietChip({ selected, onToggle, onClear, onApply, options = DIET_TAGS, iconOnly = false }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const staged = Boolean(onApply);
  const checked = staged ? draft : selected;
  const close = () => setOpen(false);
  const openFilters = () => {
    if (staged) setDraft(selected);
    setOpen(true);
  };
  return (
    <>
      {iconOnly ? (
        <PressableScale
          onPress={openFilters}
          style={[styles.iconButton, selected.length > 0 && styles.active]}
          accessibilityLabel={`Dietary filters, ${selected.length} active`}
          accessibilityState={{ expanded: open }}
        >
          <Ionicons name="filter-outline" size={22} color={colors.primaryText} />
          <BumpBadge value={selected.length} style={styles.count} />
        </PressableScale>
      ) : (
        <Chip
          label={staged ? 'Dietary filters' : 'Diet'}
          icon={staged ? 'filter-outline' : 'leaf-outline'}
          selected={selected.length > 0}
          count={selected.length || undefined}
          onPress={openFilters}
        />
      )}
      <ConfirmModal
        visible={open}
        icon="leaf"
        title={staged ? 'Dietary filters' : 'Dietary preferences'}
        message="Show items that match all selected filters."
        confirmLabel={staged ? 'Apply filters' : 'Done'}
        cancelLabel={staged || selected.length ? 'Clear all' : undefined}
        onConfirm={() => {
          if (staged) onApply(draft);
          close();
        }}
        onCancel={staged ? () => { onClear(); close(); } : selected.length ? onClear : undefined}
        onDismiss={staged ? close : undefined}
      >
        <FlatList
          data={options}
          keyExtractor={(item) => item.id}
          style={{ alignSelf: 'stretch', marginTop: spacing.md, flexGrow: 0, maxHeight: 288 }}
          renderItem={({ item }) => {
            const on = checked.includes(item.id);
            return (
              <PressableScale
                key={item.id}
                onPress={() => {
                  if (staged) {
                    setDraft((prev) => prev.includes(item.id)
                      ? prev.filter((id) => id !== item.id)
                      : [...prev, item.id]);
                  } else {
                    onToggle(item.id);
                  }
                }}
                accessibilityLabel={item.label}
                accessibilityRole={iconOnly ? 'checkbox' : 'button'}
                accessibilityState={iconOnly ? { checked: on } : { selected: on }}
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
                {!staged ? <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.emoji}</Text> : null}
                <Text style={{ flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text }} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {item.label}
                </Text>
                <Ionicons
                  name={iconOnly ? (on ? 'checkbox' : 'square-outline') : (on ? 'checkmark-circle' : 'ellipse-outline')}
                  size={24}
                  color={on ? colors.primaryText : colors.textMuted}
                />
              </PressableScale>
            );
          }}
        />
      </ConfirmModal>
    </>
  );
}
