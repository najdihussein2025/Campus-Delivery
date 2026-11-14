import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import { colors, MAX_FONT_SCALE } from '../theme/theme';
import styles from './ConfirmModal.styles';

const TONE_COLORS = {
  primary: [colors.primary, colors.primarySoft],
  danger: [colors.danger, colors.dangerSoft],
  success: [colors.success, colors.successSoft],
  warning: [colors.warning, colors.warningSoft],
};

// Bottom-sheet replacement for Alert.alert (one button when onCancel or cancelLabel is missing)
export default function ConfirmModal({
  visible,
  title,
  message,
  icon = 'help-circle',
  tone = 'primary',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  children,
}) {
  const insets = useSafeAreaInsets();
  const [toneColor, toneSoft] = TONE_COLORS[tone] || TONE_COLORS.primary;
  const showCancel = Boolean(cancelLabel && onCancel);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancel || onConfirm}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onCancel || onConfirm}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <View style={[styles.iconCircle, { backgroundColor: toneSoft }]}>
            <Ionicons name={icon} size={30} color={toneColor} />
          </View>
          <Text style={styles.title} maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text>
          {message ? <Text style={styles.message} maxFontSizeMultiplier={MAX_FONT_SCALE}>{message}</Text> : null}
          {children}
          <View style={styles.actions}>
            {showCancel ? (
              <AppButton title={cancelLabel} variant="secondary" haptic={false} onPress={onCancel} style={styles.action} />
            ) : null}
            <AppButton
              title={confirmLabel}
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
