import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { spacing } from '@/design-system/tokens/theme';
import { type Language, useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

const languageOptions: ReadonlyArray<{
  value: Language;
  labelKey: TranslationKey;
}> = [
  { value: 'en', labelKey: 'onboarding.language.english' },
  { value: 'id', labelKey: 'onboarding.language.indonesian' },
];

export function LanguageSelector() {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  return (
    <View style={styles.section} accessibilityRole="radiogroup">
      <Text variant="label" color="textMuted">
        {t('onboarding.language.title')}
      </Text>
      <View style={styles.options}>
        {languageOptions.map((option) => {
          const selected = language === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setLanguage(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="label"
                color={selected ? 'onPrimary' : 'text'}
                style={styles.label}
              >
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  options: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: spacing[12],
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
