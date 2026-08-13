import { useState } from 'react';
import {
  TextInput,
  type TextInputProps,
  type TextInputFocusEventData,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeProvider';

type TextFieldProps = TextInputProps & {
  hasError?: boolean;
  textVariant?: 'body' | 'bodyStrong';
};

export function TextField({
  hasError = false,
  textVariant = 'body',
  onBlur,
  onFocus,
  placeholderTextColor,
  selectionColor,
  style,
  ...props
}: TextFieldProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (
    event: NativeSyntheticEvent<TextInputFocusEventData>,
  ) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <TextInput
      {...props}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholderTextColor={placeholderTextColor ?? theme.colors.textMuted}
      selectionColor={selectionColor ?? theme.colors.primary}
      style={[
        theme.typography[textVariant],
        style,
        {
          backgroundColor: theme.colors.surface,
          borderColor: hasError
            ? theme.colors.danger
            : isFocused
              ? theme.colors.controlBorderFocused
              : theme.colors.controlBorder,
          color: theme.colors.text,
        },
      ]}
    />
  );
}
