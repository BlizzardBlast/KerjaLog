import * as Sentry from '@sentry/react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/design-system/components/Button';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { layout, radii, spacing } from '@/design-system/tokens/theme';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import { portableBackupRepository } from '@/data/repositories/portableBackupRepository';
import type { PortableBackup } from '@/domain/portability/model';
import type { ReviewDraft } from '@/domain/review/model';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { ReviewBackupPanel } from '@/features/review/ReviewBackupPanel';
import { ReviewSetupForm } from '@/features/review/ReviewSetupForm';
import { useI18n } from '@/i18n/I18nProvider';
import { portableBackupFile } from '@/platform/portability/portableBackupFile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DraftListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; drafts: ReviewDraft[] };

function ProfiledReviewScreen() {
  const router = Sentry.wrapExpoRouter(useRouter());
  const { skillId, copyFrom } = useLocalSearchParams<{
    skillId?: string;
    copyFrom?: string;
  }>();
  const { language, restoreImportedLanguage, t } = useI18n();
  const { mode, restoreImportedMode, theme } = useTheme();
  const { restoreImportedState, state: onboarding } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<DraftListState>({ status: 'loading' });
  const [isCreating, setIsCreating] = useState(Boolean(copyFrom));
  const [portableAction, setPortableAction] = useState<
    'export' | 'import' | null
  >(null);
  const [portableError, setPortableError] = useState<
    'export' | 'import' | null
  >(null);
  const [pendingImport, setPendingImport] = useState<PortableBackup | null>(
    null,
  );
  const requestId = useRef(0);
  const portableActionInFlight = useRef(false);

  const loadDrafts = useCallback(async () => {
    const activeRequestId = ++requestId.current;
    setState({ status: 'loading' });
    try {
      const drafts = await reviewRepository.listDrafts();
      if (requestId.current === activeRequestId) {
        setState({ status: 'loaded', drafts });
      }
    } catch {
      if (requestId.current === activeRequestId) {
        setState({ status: 'error' });
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDrafts();
      return () => {
        requestId.current += 1;
      };
    }, [loadDrafts]),
  );

  const openDraft = (id: string) => {
    router.push({ pathname: '/review/[id]', params: { id } });
  };
  const handleCreated = (draft: ReviewDraft) => {
    setIsCreating(false);
    void loadDrafts();
    router.push({ pathname: '/review/[id]', params: { id: draft.id } });
  };

  const exportBackup = async () => {
    if (portableActionInFlight.current) {
      return;
    }
    portableActionInFlight.current = true;
    setPortableAction('export');
    setPortableError(null);
    try {
      const backup = await portableBackupRepository.exportBackup({
        themeMode: mode,
        language,
        onboarding,
      });
      await portableBackupFile.shareBackup(backup);
    } catch {
      setPortableError('export');
    } finally {
      portableActionInFlight.current = false;
      setPortableAction(null);
    }
  };

  const chooseImport = async () => {
    if (portableActionInFlight.current) {
      return;
    }
    portableActionInFlight.current = true;
    setPortableAction('import');
    setPortableError(null);
    try {
      const backup = await portableBackupFile.pickBackup();
      if (backup) {
        setPendingImport(backup);
      }
    } catch {
      setPortableError('import');
    } finally {
      portableActionInFlight.current = false;
      setPortableAction(null);
    }
  };

  const replaceWithImport = async () => {
    if (!pendingImport || portableActionInFlight.current) {
      return;
    }
    portableActionInFlight.current = true;
    setPortableAction('import');
    setPortableError(null);
    try {
      await portableBackupRepository.replaceWithBackup(pendingImport);
      await restoreImportedState(pendingImport.data.preferences.onboarding);
      await restoreImportedMode(pendingImport.data.preferences.themeMode);
      await restoreImportedLanguage(pendingImport.data.preferences.language);
      setPendingImport(null);
      void loadDrafts();
    } catch {
      setPortableError('import');
    } finally {
      portableActionInFlight.current = false;
      setPortableAction(null);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: Math.max(insets.left, layout.screenHorizontalPadding),
          paddingRight: Math.max(insets.right, layout.screenHorizontalPadding),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {isCreating || copyFrom ? (
        <ReviewSetupForm
          skillId={typeof skillId === 'string' ? skillId : undefined}
          copyFromDraftId={typeof copyFrom === 'string' ? copyFrom : undefined}
          onCancel={() => {
            setIsCreating(false);
            router.setParams({ copyFrom: undefined, skillId: undefined });
          }}
          onCreated={handleCreated}
        />
      ) : (
        <>
          <View style={styles.heading}>
            <Text variant="overline" color="primary">
              {t('review.eyebrow')}
            </Text>
            <Text accessibilityRole="header" variant="title">
              {t('review.title')}
            </Text>
            <Text color="textMuted">{t('review.description')}</Text>
          </View>
          <Button fullWidth onPress={() => setIsCreating(true)}>
            {t('review.new')}
          </Button>
          <ReviewBackupPanel
            action={portableAction}
            error={portableError}
            pendingImport={pendingImport}
            onChooseImport={() => void chooseImport()}
            onDiscardImport={() => setPendingImport(null)}
            onExport={() => void exportBackup()}
            onReplace={() => void replaceWithImport()}
          />
          {state.status === 'loading' ? (
            <View
              accessibilityRole="progressbar"
              accessibilityState={{ busy: true }}
              accessibilityLabel={t('review.loading')}
              style={styles.loading}
            >
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null}
          {state.status === 'error' ? (
            <View accessibilityRole="alert" style={styles.stateCard}>
              <Text variant="subheading">{t('review.error.title')}</Text>
              <Text color="textMuted">{t('review.error.description')}</Text>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => void loadDrafts()}
              >
                {t('review.retry')}
              </Button>
            </View>
          ) : null}
          {state.status === 'loaded' && state.drafts.length === 0 ? (
            <View style={styles.stateCard}>
              <Text variant="subheading">{t('review.empty.title')}</Text>
              <Text color="textMuted">{t('review.empty.description')}</Text>
            </View>
          ) : null}
          {state.status === 'loaded' && state.drafts.length > 0 ? (
            <View style={styles.drafts}>
              <Text accessibilityRole="header" variant="subheading">
                {t('review.drafts.title')}
              </Text>
              {state.drafts.map((draft) => (
                <Pressable
                  key={draft.id}
                  accessibilityRole="button"
                  accessibilityLabel={draft.title}
                  onPress={() => openDraft(draft.id)}
                  style={({ pressed }) => [
                    styles.draft,
                    {
                      backgroundColor: pressed
                        ? theme.colors.primarySoft
                        : theme.colors.surface,
                      borderColor: theme.colors.controlBorder,
                    },
                  ]}
                >
                  <View style={styles.draftCopy}>
                    <Text variant="bodyStrong">{draft.title}</Text>
                    <Text color="textMuted" variant="caption">
                      {t('review.draft.period', draft.period)}
                    </Text>
                    <Text color="textMuted" variant="caption">
                      {t('review.draft.entries', {
                        count: draft.entries.length,
                      })}
                    </Text>
                  </View>
                  <Text color="primary">›</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const ReviewScreen = Sentry.withProfiler(ProfiledReviewScreen);

export { ReviewScreen };

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    gap: spacing[5],
    paddingBottom: spacing[8],
    paddingTop: spacing[5],
  },
  heading: { gap: spacing[2] },
  loading: { alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  stateCard: { borderRadius: radii.lg, gap: spacing[3], padding: spacing[4] },
  drafts: { gap: spacing[3] },
  draft: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 64,
    padding: spacing[3],
  },
  draftCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
});
