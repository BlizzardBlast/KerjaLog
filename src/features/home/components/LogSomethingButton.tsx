import { SymbolView } from 'expo-symbols';
import { Button } from '@/design-system/components/Button';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { useI18n } from '@/i18n/I18nProvider';

type LogSomethingButtonProps = {
  onPress: () => void;
};

export function LogSomethingButton({ onPress }: LogSomethingButtonProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <Button
      fullWidth
      leadingIcon={
        <SymbolView
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={20}
          tintColor={theme.colors.onPrimary}
        />
      }
      onPress={onPress}
      size="lg"
    >
      {t('home.logSomething')}
    </Button>
  );
}
