import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { useI18n } from '@/i18n/I18nProvider';

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

  return (
    <View style={styles.container}>
      <Text variant="label">{t('history.search.label')}</Text>
      <View style={styles.fieldContainer}>
        <View pointerEvents="none" style={styles.searchIcon}>
          <SymbolView
            name="magnifyingglass"
            size={20}
            tintColor={theme.colors.textMuted}
          />
        </View>
        <TextInput
          accessibilityLabel={t('history.search.label')}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onChangeText}
          placeholder={t('history.search.placeholder')}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          value={value}
          style={[
            styles.input,
            theme.typography.body,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text,
            },
          ]}
        />
        {value ? (
          <Pressable
            accessibilityLabel={t('history.search.clear')}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => onChangeText('')}
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name="xmark.circle.fill"
              size={20}
              tintColor={theme.colors.textMuted}
            />
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
    paddingLeft: 44,
    paddingRight: 52,
  },
  searchIcon: {
    left: 14,
    position: 'absolute',
    zIndex: 1,
  },
  clearButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 44,
  },
  pressed: {
    opacity: 0.65,
  },
});
