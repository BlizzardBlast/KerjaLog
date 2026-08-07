import { useI18n } from '@/i18n/I18nProvider';
import { PlaceholderTabScreen } from '@/shared/components/PlaceholderTabScreen';

export default function GrowthRoute() {
  const { t } = useI18n();

  return (
    <PlaceholderTabScreen
      eyebrow={t('placeholder.growth.eyebrow')}
      title={t('placeholder.growth.title')}
      description={t('placeholder.growth.description')}
    />
  );
}
