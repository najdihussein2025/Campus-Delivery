import React, { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAX_FONT_SCALE } from '../theme/theme';
import { createStyles } from './AppInput.styles';
import useThemedStyles from '../hooks/useThemedStyles';
import { useTheme } from '../context/ThemeContext';

// Text field with label, icon, error, password toggle, fixed suffix and clear button (forwardRef for focus chaining)
const AppInput = forwardRef(function AppInput(
  { label, icon, error, secure = false, suffix, clearable = false, onClear, style, onFocus, onBlur, value, ...inputProps },
  ref
) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);
  const iconColor = error ? colors.danger : focused ? colors.primaryText : colors.textMuted;
  const showClear = clearable && value ? true : false;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label} maxFontSizeMultiplier={MAX_FONT_SCALE}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.fieldFocused, error && styles.fieldError]}>
        {icon ? <Ionicons name={icon} size={19} color={iconColor} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...inputProps}
        />
        {suffix ? <Text style={styles.suffix} maxFontSizeMultiplier={MAX_FONT_SCALE}>{suffix}</Text> : null}
        {showClear ? (
          <Pressable onPress={onClear} hitSlop={12} style={styles.trailing} accessibilityRole="button" accessibilityLabel="Clear text">
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
        {secure ? (
          <Pressable
            onPress={() => setHidden(!hidden)}
            hitSlop={12}
            style={styles.trailing}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.dangerText} />
          <Text style={styles.error} maxFontSizeMultiplier={MAX_FONT_SCALE}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

export default AppInput;
