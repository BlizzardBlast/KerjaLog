import type { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { LogEventIntent } from '@/domain/entry/impact';
import type { EvidenceType, OutcomeType } from '@/domain/entry/model';
import type { TranslationKey } from '@/i18n/catalog';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type LogOption<Value extends string> = {
  value: Value;
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
  icon?: SymbolName;
};

export const logEventOptions: ReadonlyArray<LogOption<LogEventIntent>> = [
  {
    value: 'completed',
    titleKey: 'log.intent.completed.title',
    descriptionKey: 'log.intent.completed.description',
    icon: {
      ios: 'checkmark.circle.fill',
      android: 'check_circle',
      web: 'check_circle',
    },
  },
  {
    value: 'solved',
    titleKey: 'log.intent.solved.title',
    descriptionKey: 'log.intent.solved.description',
    icon: {
      ios: 'wrench.and.screwdriver.fill',
      android: 'build',
      web: 'build',
    },
  },
  {
    value: 'helped',
    titleKey: 'log.intent.helped.title',
    descriptionKey: 'log.intent.helped.description',
    icon: { ios: 'person.2.fill', android: 'group', web: 'group' },
  },
  {
    value: 'feedback',
    titleKey: 'log.intent.feedback.title',
    descriptionKey: 'log.intent.feedback.description',
    icon: { ios: 'text.bubble.fill', android: 'chat', web: 'chat' },
  },
  {
    value: 'learned',
    titleKey: 'log.intent.learned.title',
    descriptionKey: 'log.intent.learned.description',
    icon: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  },
  {
    value: 'ownership',
    titleKey: 'log.intent.ownership.title',
    descriptionKey: 'log.intent.ownership.description',
    icon: { ios: 'flag.fill', android: 'flag', web: 'flag' },
  },
  {
    value: 'challenge',
    titleKey: 'log.intent.challenge.title',
    descriptionKey: 'log.intent.challenge.description',
    icon: {
      ios: 'exclamationmark.triangle.fill',
      android: 'warning',
      web: 'warning',
    },
  },
];

export const outcomeOptions: ReadonlyArray<LogOption<OutcomeType>> = [
  {
    value: 'error_fixed_or_prevented',
    titleKey: 'log.outcome.errorFixed.title',
    descriptionKey: 'log.outcome.errorFixed.description',
  },
  { value: 'deadline_met', titleKey: 'log.outcome.deadlineMet.title' },
  { value: 'work_faster', titleKey: 'log.outcome.workFaster.title' },
  { value: 'work_clearer', titleKey: 'log.outcome.workClearer.title' },
  { value: 'person_helped', titleKey: 'log.outcome.personHelped.title' },
  { value: 'risk_reduced', titleKey: 'log.outcome.riskReduced.title' },
  { value: 'decision_enabled', titleKey: 'log.outcome.decisionEnabled.title' },
  { value: 'skill_gained', titleKey: 'log.outcome.skillGained.title' },
  {
    value: 'unsure',
    titleKey: 'log.outcome.unsure.title',
    descriptionKey: 'log.outcome.unsure.description',
  },
];

export const evidenceOptions: ReadonlyArray<LogOption<EvidenceType>> = [
  { value: 'number', titleKey: 'log.evidence.number.title' },
  { value: 'deadline', titleKey: 'log.evidence.deadline.title' },
  { value: 'result', titleKey: 'log.evidence.result.title' },
  { value: 'feedback', titleKey: 'log.evidence.feedback.title' },
  { value: 'people_helped', titleKey: 'log.evidence.peopleHelped.title' },
  { value: 'reference_link', titleKey: 'log.evidence.referenceLink.title' },
  { value: 'supporting_note', titleKey: 'log.evidence.supportingNote.title' },
];
