import React from 'react';
import { View } from 'react-native';
import FadeInView from './FadeInView';

const STAGGER_MS = 45;
const MAX_ANIMATED = 8;

// List item entrance: the first 8 rows fade in one after another, later rows appear instantly
export default function StaggerItem({ index = 0, style, children }) {
  if (index >= MAX_ANIMATED) return <View style={style}>{children}</View>;
  return (
    <FadeInView delay={index * STAGGER_MS} style={style}>
      {children}
    </FadeInView>
  );
}
