import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import { type Language, useI18n } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translations';

type LanguageOption = {
  value: Language;
  flag: string;
  labelKey: TranslationKey;
};

const languageOptions = [
  { value: 'en', flag: '🇬🇧', labelKey: 'onboarding.language.english' },
  { value: 'id', flag: '🇮🇩', labelKey: 'onboarding.language.indonesian' },
] as const satisfies readonly LanguageOption[];

export function LanguageSelector() {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption =
    languageOptions.find((option) => option.value === language) ??
    languageOptions[0];

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityLabel={t('onboarding.language.change')}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        hitSlop={spacing[1]}
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text variant="body" style={styles.flag}>
          {selectedOption.flag}
        </Text>
        <SymbolView
          name={{
            ios: 'chevron.down',
            android: 'keyboard_arrow_down',
            web: 'keyboard_arrow_down',
          }}
          size={16}
          tintColor={theme.colors.textMuted}
        />
      </Pressable>

      {isOpen ? (
        <View
          accessibilityRole="radiogroup"
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {languageOptions.map((option) => {
            const selected = language === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setLanguage(option.value);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && {
                    backgroundColor: theme.colors.primarySoft,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body" style={styles.flag}>
                  {option.flag}
                </Text>
                <Text variant="label" style={styles.optionLabel}>
                  {t(option.labelKey)}
                </Text>
                {selected ? (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={16}
                    tintColor={theme.colors.primary}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    zIndex: 20,
  },
  trigger: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: spacing[12],
    minWidth: 62,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  flag: {
    lineHeight: 22,
  },
  menu: {
    borderRadius: radii.md,
    borderWidth: 1,
    boxShadow: '0 12px 28px rgba(49, 32, 57, 0.16)',
    marginTop: spacing[2],
    minWidth: 190,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: '100%',
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: spacing[12],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  optionLabel: {
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
});
