import { Button } from '@/design-system/components/Button';
import { AppIcon } from '@/design-system/icons/AppIcon';
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
        <AppIcon
          name={{ ios: 'plus', android: 'add' }}
          size={20}
          color={theme.colors.onPrimary}
        />
      }
      onPress={onPress}
      size="lg"
    >
      {t('home.logSomething')}
    </Button>
  );
}
