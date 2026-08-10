import { useI18n } from '@/i18n/I18nProvider';
import { PlaceholderTabScreen } from '@/shared/components/PlaceholderTabScreen';

export default function HistoryRoute() {
  const { t } = useI18n();

  return (
    <PlaceholderTabScreen
      eyebrow={t('placeholder.history.eyebrow')}
      title={t('placeholder.history.title')}
      description={t('placeholder.history.description')}
    />
  );
}
