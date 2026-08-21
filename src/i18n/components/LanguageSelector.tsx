import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/design-system/icons/AppIcon';
import {
  type AnchorFrame,
  getAnchoredPopoverLayout,
} from '@/design-system/layout/anchoredPopover';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';
import type { TranslationKey } from '@/i18n/catalog';
import { type Language, useI18n } from '@/i18n/I18nProvider';

type LanguageOption = {
  value: Language;
  flag: string;
  shortLabel: string;
  labelKey: TranslationKey;
};

const PREFERRED_MENU_WIDTH = 220;

const languageOptions = [
  {
    value: 'en',
    flag: '🇬🇧',
    shortLabel: 'EN',
    labelKey: 'common.language.english',
  },
  {
    value: 'id',
    flag: '🇮🇩',
    shortLabel: 'ID',
    labelKey: 'common.language.indonesian',
  },
] as const satisfies readonly LanguageOption[];

export function LanguageSelector() {
  const { theme } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<AnchorFrame | null>(null);
  const selectedOption =
    languageOptions.find((option) => option.value === language) ??
    languageOptions[0];
  const isOpen = anchor !== null;

  const close = () => setAnchor(null);
  const toggle = () => {
    if (isOpen) {
      close();
      return;
    }

    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  };

  const horizontalInset = Math.max(insets.left, insets.right, spacing[4]);
  const menuLayout = anchor
    ? getAnchoredPopoverLayout({
        anchor,
        windowWidth,
        horizontalInset,
        preferredWidth: PREFERRED_MENU_WIDTH,
        gap: spacing[2],
      })
    : {
        left: horizontalInset,
        top: insets.top + spacing[4],
        width: Math.min(
          PREFERRED_MENU_WIDTH,
          Math.max(0, windowWidth - horizontalInset * 2),
        ),
      };

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          accessibilityLabel={t('common.language.change')}
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          hitSlop={spacing[1]}
          onPress={toggle}
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
          <Text variant="label">{selectedOption.shortLabel}</Text>
          <AppIcon
            name={{
              ios: 'chevron.down',
              android: 'keyboard_arrow_down',
            }}
            size={16}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
        transparent
        visible={isOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={close}
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
                ...menuLayout,
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
                    close();
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
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[1],
    justifyContent: 'center',
    minHeight: spacing[12],
    minWidth: 82,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  flag: {
    lineHeight: 22,
  },
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
