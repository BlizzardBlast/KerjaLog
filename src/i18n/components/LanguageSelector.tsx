import { useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type AnchorFrame,
  getAnchoredPopoverLayout,
} from '@/design-system/layout/anchoredPopover';
import { spacing } from '@/design-system/tokens/theme';
import { LanguageSelectorMenu } from '@/i18n/components/LanguageSelectorMenu';
import { LanguageSelectorTrigger } from '@/i18n/components/LanguageSelectorTrigger';
import { getLanguageOption } from '@/i18n/components/languageSelectorOptions';
import { useI18n } from '@/i18n/I18nProvider';

const PREFERRED_MENU_WIDTH = 220;

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<AnchorFrame | null>(null);
  const selectedOption = getLanguageOption(language);

  const close = () => setAnchor(null);
  const toggle = () => {
    if (anchor) {
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
    : null;

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <LanguageSelectorTrigger
          option={selectedOption}
          accessibilityLabel={t('common.language.change')}
          accessibilityValue={t(selectedOption.labelKey)}
          expanded={anchor !== null}
          onPress={toggle}
        />
      </View>

      <LanguageSelectorMenu
        layout={menuLayout}
        selectedLanguage={language}
        onDismiss={close}
        onSelect={(nextLanguage) => {
          setLanguage(nextLanguage);
          close();
        }}
      />
    </>
  );
}
