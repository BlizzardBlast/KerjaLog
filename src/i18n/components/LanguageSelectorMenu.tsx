import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { AppIcon } from '@/design-system/icons/AppIcon';
import type { AnchoredPopoverLayout } from '@/design-system/layout/anchoredPopover';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { Language } from '@/i18n/catalog';
import { LANGUAGE_OPTIONS } from '@/i18n/components/languageSelectorOptions';
import { useI18n } from '@/i18n/I18nProvider';

type LanguageSelectorMenuProps = {
  layout: AnchoredPopoverLayout | null;
  selectedLanguage: Language;
  onDismiss: () => void;
  onSelect: (language: Language) => void;
};

export function LanguageSelectorMenu({
  layout,
  selectedLanguage,
  onDismiss,
  onSelect,
}: LanguageSelectorMenuProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  if (!layout) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
        />

        <View
          accessibilityRole="radiogroup"
          accessibilityViewIsModal
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              ...layout,
            },
          ]}
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const selected = selectedLanguage === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityLabel={t(option.labelKey)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => onSelect(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  selected && {
                    backgroundColor: theme.colors.primarySoft,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body">{option.flag}</Text>
                <Text variant="bodyStrong" style={styles.optionLabel}>
                  {t(option.labelKey)}
                </Text>
                {selected ? (
                  <AppIcon
                    name={{ ios: 'checkmark', android: 'check' }}
                    size={18}
                    color={theme.colors.primary}
                  />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  menu: {
    borderRadius: radii.md,
    borderWidth: 1,
    boxShadow: '0 12px 28px rgba(49, 32, 57, 0.16)',
    overflow: 'hidden',
    position: 'absolute',
  },
  option: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    minHeight: 56,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  optionLabel: {
    flex: 1,
  },
  checkPlaceholder: {
    height: 18,
    width: 18,
  },
  pressed: {
    opacity: 0.72,
  },
});
