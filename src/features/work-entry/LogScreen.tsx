import * as Sentry from '@sentry/react-native';
import { useRouter } from 'expo-router';
import { LogDraftLoadErrorScreen } from '@/features/work-entry/components/LogDraftLoadErrorScreen';
import { LogFlowScreen } from '@/features/work-entry/LogFlowScreen';
import { useWorkEntryDraft } from '@/features/work-entry/useWorkEntryDraft';
import { useI18n } from '@/i18n/I18nProvider';
import { RouteLoadingScreen } from '@/shared/components/RouteLoadingScreen';

function ProfiledLogScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { t } = useI18n();
  const { state, retry } = useWorkEntryDraft();

  if (state.status === 'loading') {
    return <RouteLoadingScreen label={t('log.draft.loading')} />;
  }

  if (state.status === 'error') {
    return (
      <LogDraftLoadErrorScreen
        onBackHome={() => router.replace('/home')}
        onRetry={retry}
      />
    );
  }

  return <LogFlowScreen initialDraft={state.draft} />;
}

const LogScreen = Sentry.withProfiler(ProfiledLogScreen);

export { LogScreen };
