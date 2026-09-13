import { useForm, useSelector } from '@tanstack/react-form';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/design-system/components/Button';
import { OptionCard } from '@/design-system/components/OptionCard';
import { Text } from '@/design-system/components/Text';
import {
  createReviewDraftDocument,
  createReviewDraftEntries,
  recommendReviewCandidates,
} from '@/domain/review/document';
import { getReviewPeriod } from '@/domain/review/period';
import {
  REVIEW_PERIOD_PRESETS,
  REVIEW_PURPOSES,
  type ReviewCandidate,
  type ReviewDraft,
  type ReviewPeriod,
  type ReviewPeriodPreset,
  type ReviewPurpose,
} from '@/domain/review/model';
import { reviewRepository } from '@/data/repositories/reviewRepository';
import { isSkillId } from '@/domain/skill/model';
import { ReviewDatePicker } from '@/features/review/ReviewDatePicker';
import {
  createReviewDocumentCopy,
  getReviewPurposeTitle,
} from '@/features/review/reviewCopy';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/design-system/theme/ThemeProvider';
import { radii, spacing } from '@/design-system/tokens/theme';

type CandidateState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; candidates: ReviewCandidate[] };

type ReviewSetupFormProps = {
  skillId: string | undefined;
  copyFromDraftId: string | undefined;
  onCancel: () => void;
  onCreated: (draft: ReviewDraft) => void;
};

export function ReviewSetupForm({
  skillId,
  copyFromDraftId,
  onCancel,
  onCreated,
}: Readonly<ReviewSetupFormProps>) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const supportedSkillId = skillId && isSkillId(skillId) ? skillId : null;
  const [candidateState, setCandidateState] = useState<CandidateState>({
    status: 'loading',
  });
  const [copyFromDraft, setCopyFromDraft] = useState<ReviewDraft | null>(null);
  const [selectionError, setSelectionError] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [candidateReload, setCandidateReload] = useState(0);
  const candidateRequestId = useRef(0);
  const sourceDraftRequestId = useRef(0);
  const initializedSelectionKey = useRef<string | null>(null);
  const selectedSourceDraft =
    copyFromDraft?.id === copyFromDraftId ? copyFromDraft : null;
  const initialPeriod = getReviewPeriod('this_month', new Date());
  const form = useForm({
    defaultValues: {
      purpose: 'performance_self_review' as ReviewPurpose,
      preset: 'this_month' as ReviewPeriodPreset,
      period: initialPeriod,
      selectedEntryIds: [] as string[],
      title: '',
    },
    onSubmit: async ({ value }) => {
      const candidates =
        candidateState.status === 'loaded' ? candidateState.candidates : [];
      const selected = candidates.filter((candidate) =>
        value.selectedEntryIds.includes(candidate.id),
      );
      if (selected.length === 0) {
        setSelectionError(true);
        return;
      }
      setSelectionError(false);
      setCreateError(false);
      try {
        const entries = createReviewDraftEntries(selected);
        const purposeTitle = getReviewPurposeTitle(value.purpose, t);
        const created = await reviewRepository.createDraft({
          title:
            value.title.trim() ||
            t('review.draft.defaultName', { purpose: purposeTitle }),
          purpose: value.purpose,
          period: value.period,
          entries,
          document: createReviewDraftDocument(
            value.purpose,
            entries,
            createReviewDocumentCopy(t),
          ),
        });
        onCreated(created);
      } catch {
        setCreateError(true);
      }
    },
  });
  const purpose = useSelector(form.store, (state) => state.values.purpose);
  const preset = useSelector(form.store, (state) => state.values.preset);
  const period = useSelector(form.store, (state) => state.values.period);
  const selectedEntryIds = useSelector(
    form.store,
    (state) => state.values.selectedEntryIds,
  );
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
  const candidateRequestKey = `${period.startDate}:${period.endDate}:${supportedSkillId ?? ''}:${selectedSourceDraft?.id ?? ''}:${candidateReload}`;

  useEffect(() => {
    if (!copyFromDraftId?.trim()) {
      return;
    }
    const requestId = ++sourceDraftRequestId.current;
    void reviewRepository.findDraft(copyFromDraftId).then(
      (draft) => {
        if (sourceDraftRequestId.current !== requestId || !draft) {
          return;
        }
        setCopyFromDraft(draft);
        form.setFieldValue('purpose', draft.purpose);
        form.setFieldValue('preset', 'custom');
        form.setFieldValue('period', draft.period);
        form.setFieldValue(
          'title',
          t('review.draft.copyName', { title: draft.title }),
        );
      },
      () => {
        if (sourceDraftRequestId.current === requestId) {
          setCopyFromDraft(null);
        }
      },
    );

    return () => {
      sourceDraftRequestId.current += 1;
    };
  }, [copyFromDraftId, form, t]);

  const reloadCandidates = useCallback(() => {
    const requestId = ++candidateRequestId.current;
    setCandidateState({ status: 'loading' });
    void reviewRepository
      .findCandidates({ period, skillId: supportedSkillId })
      .then(
        (candidates) => {
          if (candidateRequestId.current !== requestId) {
            return;
          }
          setCandidateState({ status: 'loaded', candidates });
          if (initializedSelectionKey.current === candidateRequestKey) {
            return;
          }
          initializedSelectionKey.current = candidateRequestKey;
          const suggested = selectedSourceDraft
            ? candidates.filter((candidate) =>
                selectedSourceDraft.entries.some(
                  (entry) => entry.sourceEntryId === candidate.id,
                ),
              )
            : supportedSkillId
              ? []
              : recommendReviewCandidates(candidates);
          form.setFieldValue(
            'selectedEntryIds',
            suggested.map((candidate) => candidate.id),
          );
        },
        () => {
          if (candidateRequestId.current === requestId) {
            setCandidateState({ status: 'error' });
          }
        },
      );
  }, [
    candidateRequestKey,
    form,
    period,
    selectedSourceDraft,
    supportedSkillId,
  ]);

  useFocusEffect(
    useCallback(() => {
      reloadCandidates();
      return () => {
        candidateRequestId.current += 1;
      };
    }, [reloadCandidates]),
  );

  const choosePurpose = (nextPurpose: ReviewPurpose) => {
    form.setFieldValue('purpose', nextPurpose);
    setCreateError(false);
  };
  const choosePreset = (nextPreset: ReviewPeriodPreset) => {
    form.setFieldValue('preset', nextPreset);
    if (nextPreset !== 'custom') {
      form.setFieldValue('period', getReviewPeriod(nextPreset, new Date()));
    }
    setCreateError(false);
  };
  const updatePeriod = (field: keyof ReviewPeriod, nextValue: string) => {
    form.setFieldValue('period', { ...period, [field]: nextValue });
    setCreateError(false);
  };
  const toggleCandidate = (id: string) => {
    form.setFieldValue(
      'selectedEntryIds',
      selectedEntryIds.includes(id)
        ? selectedEntryIds.filter((entryId) => entryId !== id)
        : [...selectedEntryIds, id],
    );
    setSelectionError(false);
  };

  return (
    <View style={styles.content}>
      <View style={styles.heading}>
        <Text variant="overline" color="primary">
          {t('review.setup.eyebrow')}
        </Text>
        <Text accessibilityRole="header" variant="title">
          {t('review.setup.title')}
        </Text>
        <Text color="textMuted">{t('review.setup.description')}</Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.group}>
        <Text variant="subheading">{t('review.setup.purpose')}</Text>
        {REVIEW_PURPOSES.map((option) => (
          <OptionCard
            key={option}
            title={t(`review.purpose.${option}.title`)}
            description={t(`review.purpose.${option}.description`)}
            selected={purpose === option}
            onPress={() => choosePurpose(option)}
          />
        ))}
      </View>

      <View accessibilityRole="radiogroup" style={styles.group}>
        <Text variant="subheading">{t('review.setup.period')}</Text>
        <View style={styles.optionGrid}>
          {REVIEW_PERIOD_PRESETS.map((option) => (
            <View key={option} style={styles.optionCell}>
              <OptionCard
                title={t(`review.period.${option}`)}
                selected={preset === option}
                onPress={() => choosePreset(option)}
              />
            </View>
          ))}
        </View>
      </View>

      {preset === 'custom' ? (
        <View style={styles.group}>
          <Text variant="subheading">{t('review.setup.customDates')}</Text>
          <ReviewDatePicker
            label={t('review.setup.startDate')}
            value={period.startDate}
            onChange={(value) => updatePeriod('startDate', value)}
          />
          <ReviewDatePicker
            label={t('review.setup.endDate')}
            value={period.endDate}
            onChange={(value) => updatePeriod('endDate', value)}
          />
        </View>
      ) : null}

      <View style={styles.group}>
        <Text variant="subheading">{t('review.setup.entries')}</Text>
        <Text color="textMuted" variant="caption">
          {supportedSkillId
            ? t('review.setup.growthHint')
            : t('review.setup.candidateHint')}
        </Text>
        {candidateState.status === 'loading' ? (
          <View
            accessibilityRole="progressbar"
            accessibilityState={{ busy: true }}
            accessibilityLabel={t('review.setup.candidatesLoading')}
            style={styles.loading}
          >
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}
        {candidateState.status === 'error' ? (
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={styles.alert}
          >
            <Text color="textMuted">{t('review.setup.candidatesError')}</Text>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                initializedSelectionKey.current = null;
                setCandidateReload((value) => value + 1);
              }}
            >
              {t('review.retry')}
            </Button>
          </View>
        ) : null}
        {candidateState.status === 'loaded' &&
        candidateState.candidates.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.surfaceSubtle,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text color="textMuted">{t('review.setup.noCandidates')}</Text>
          </View>
        ) : null}
        {candidateState.status === 'loaded'
          ? candidateState.candidates.map((candidate) => {
              const selected = selectedEntryIds.includes(candidate.id);
              const statement =
                candidate.impactStatement?.trim() || candidate.rawNote;
              return (
                <Pressable
                  key={candidate.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={candidate.title}
                  onPress={() => toggleCandidate(candidate.id)}
                  style={({ pressed }) => [
                    styles.candidate,
                    {
                      backgroundColor: selected
                        ? theme.colors.primarySoft
                        : theme.colors.surface,
                      borderColor: selected
                        ? theme.colors.controlBorderFocused
                        : theme.colors.controlBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.candidateCopy}>
                    <Text variant="bodyStrong">{candidate.title}</Text>
                    <Text color="textMuted" variant="caption">
                      {statement}
                    </Text>
                  </View>
                  <Text color={selected ? 'primary' : 'textMuted'}>
                    {selected ? '✓' : '○'}
                  </Text>
                </Pressable>
              );
            })
          : null}
        {selectionError ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            color="danger"
            variant="caption"
          >
            {t('review.setup.chooseEntry')}
          </Text>
        ) : null}
      </View>

      {createError ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          color="danger"
        >
          {t('review.setup.createError')}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button fullWidth variant="secondary" onPress={onCancel}>
          {t('review.cancel')}
        </Button>
        <Button
          fullWidth
          loading={isSubmitting}
          onPress={() => form.handleSubmit()}
        >
          {t('review.setup.create')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[5] },
  heading: { gap: spacing[2] },
  group: { gap: spacing[3] },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  optionCell: { flexBasis: '46%', flexGrow: 1, minWidth: 140 },
  loading: { alignItems: 'center', justifyContent: 'center', minHeight: 80 },
  alert: { gap: spacing[3] },
  emptyCard: { borderRadius: radii.md, borderWidth: 1, padding: spacing[3] },
  candidate: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing[3],
    minHeight: 56,
    padding: spacing[3],
  },
  candidateCopy: { flex: 1, gap: spacing[1], minWidth: 0 },
  pressed: { opacity: 0.82 },
  actions: { gap: spacing[3] },
});
