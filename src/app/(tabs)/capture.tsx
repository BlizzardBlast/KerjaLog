import { useI18n } from '@/i18n/I18nProvider';
import { PlaceholderTabScreen } from '@/shared/components/PlaceholderTabScreen';

export default function CaptureRoute() {
  const { t } = useI18n();

  return (
    <PlaceholderTabScreen
      eyebrow={t('placeholder.capture.eyebrow')}
      title={t('placeholder.capture.title')}
      description={t('placeholder.capture.description')}
    />
  );
}
