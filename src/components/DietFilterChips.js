import React from 'react';
import { FlatList } from 'react-native';
import Chip from './Chip';
import { DIET_TAGS } from '../utils/diet';

// Multi-select dietary filter chips: Vegetarian 🥗, Vegan 🌱, Siyami ✝️, Halal ☪️, Iftar 🌙
export default function DietFilterChips({ selected, onToggle, contentContainerStyle }) {
  return (
    <FlatList
      data={DIET_TAGS}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      extraData={selected}
      contentContainerStyle={contentContainerStyle}
      renderItem={({ item }) => (
        <Chip
          label={`${item.emoji} ${item.label}`}
          selected={selected.includes(item.id)}
          onPress={() => onToggle(item.id)}
        />
      )}
    />
  );
}
