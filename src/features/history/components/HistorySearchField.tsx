import { Pressable, StyleSheet, View } from 'react-native';
import { DecorativeView } from '@/design-system/components/DecorativeView';
import { Text } from '@/design-system/components/Text';
import { TextField } from '@/design-system/components/TextField';
import { AppIcon, type AppIconName } from '@/design-system/icons/AppIcon';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { HISTORY_SEARCH_MAX_LENGTH } from '@/domain/entry/history';
import { useI18n } from '@/i18n/I18nProvider';

const SEARCH_LABEL_ID = 'history-search-label';
const SEARCH_ICON = {
  ios: 'magnifyingglass',
  android: 'search',
} satisfies AppIconName;

const CLEAR_ICON = {
  ios: 'xmark.circle.fill',
  android: 'cancel',
} satisfies AppIconName;

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
      <Text nativeID={SEARCH_LABEL_ID} variant="label">
        {t('history.search.label')}
      </Text>
      <View style={styles.fieldContainer}>
        <DecorativeView pointerEvents="none" style={styles.searchIcon}>
          <AppIcon
            name={SEARCH_ICON}
            size={20}
            color={theme.colors.textMuted}
          />
        </DecorativeView>
        <TextField
          accessibilityLabel={t('history.search.label')}
          accessibilityLabelledBy={SEARCH_LABEL_ID}
          accessibilityRole="search"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={HISTORY_SEARCH_MAX_LENGTH}
          onChangeText={onChangeText}
          placeholder={t('history.search.placeholder')}
          returnKeyType="search"
          style={styles.input}
          value={value}
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
              <AppIcon
                name={CLEAR_ICON}
                size={20}
                color={theme.colors.textMuted}
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
