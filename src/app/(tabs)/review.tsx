import { useI18n } from '@/i18n/I18nProvider';
import { PlaceholderTabScreen } from '@/shared/components/PlaceholderTabScreen';

export default function ReviewRoute() {
  const { t } = useI18n();

  return (
    <PlaceholderTabScreen
      eyebrow={t('placeholder.review.eyebrow')}
      title={t('placeholder.review.title')}
      description={t('placeholder.review.description')}
    />
  );
}
