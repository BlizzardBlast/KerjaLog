import { SymbolView } from 'expo-symbols';
import { type ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { HISTORY_SEARCH_MAX_LENGTH } from '@/domain/entry/history';
import { useI18n } from '@/i18n/I18nProvider';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const SEARCH_SYMBOL = {
  ios: 'magnifyingglass',
  android: 'search',
  web: 'search',
} satisfies SymbolName;

const CLEAR_SYMBOL = {
  ios: 'xmark.circle.fill',
  android: 'cancel',
  web: 'cancel',
} satisfies SymbolName;

type HistorySearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function HistorySearchField({
  value,
  onChangeText,
}: HistorySearchFieldProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant="label">{t('history.search.label')}</Text>
      <View style={styles.fieldContainer}>
        <DecorativeView pointerEvents="none" style={styles.searchIcon}>
          <SymbolView
            name={SEARCH_SYMBOL}
            size={20}
            tintColor={theme.colors.textMuted}
          />
        </DecorativeView>
        <TextInput
          accessibilityLabel={t('history.search.label')}
          accessibilityRole="search"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={HISTORY_SEARCH_MAX_LENGTH}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          placeholder={t('history.search.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          value={value}
          style={[
            styles.input,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isFocused
                ? theme.colors.controlBorderFocused
                : theme.colors.controlBorder,
              color: theme.colors.text,
            },
          ]}
        />
        {value ? (
          <Pressable
            accessibilityLabel={t('history.search.clear')}
            accessibilityRole="button"
            hitSlop={spacing[1]}
            onPress={() => onChangeText('')}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <DecorativeView>
              <SymbolView
                name={CLEAR_SYMBOL}
                size={20}
                tintColor={theme.colors.textMuted}
              />
            </DecorativeView>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  fieldContainer: {
    justifyContent: 'center',
    position: 'relative',
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    paddingLeft: spacing[10],
    paddingRight: spacing[12],
  },
  searchIcon: {
    left: spacing[3],
    position: 'absolute',
    zIndex: 1,
  },
  clearButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing[1],
    width: 44,
  },
  pressed: {
    opacity: 0.65,
  },
});
