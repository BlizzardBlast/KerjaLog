import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeProvider';

type TextFieldProps = TextInputProps & {
  hasError?: boolean;
  textVariant?: 'body' | 'bodyStrong';
};

type TextInputFocusHandler = NonNullable<TextInputProps['onFocus']>;
type TextInputBlurHandler = NonNullable<TextInputProps['onBlur']>;

export function TextField({
  hasError = false,
  textVariant = 'body',
  onBlur,
  onFocus,
  placeholderTextColor,
  selectionColor,
  style,
  ...props
}: Readonly<TextFieldProps>) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputFocusHandler = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputBlurHandler = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  let borderColor = theme.colors.controlBorder;
  if (hasError) {
    borderColor = theme.colors.danger;
  } else if (isFocused) {
    borderColor = theme.colors.controlBorderFocused;
  }

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
          borderColor,
          color: theme.colors.text,
        },
      ]}
    />
  );
}
