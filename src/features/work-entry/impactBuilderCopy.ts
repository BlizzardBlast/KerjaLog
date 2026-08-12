import type { ImpactBuilderCopy } from '@/domain/entry/impact';
import type { Translate } from '@/features/work-entry/components/logStepTypes';

export function createImpactBuilderCopy(t: Translate): ImpactBuilderCopy {
  return {
    intentLead: {
      completed: t('log.intent.completed.title'),
      solved: t('log.intent.solved.title'),
      helped: t('log.intent.helped.title'),
      feedback: t('log.intent.feedback.title'),
      learned: t('log.intent.learned.title'),
      ownership: t('log.intent.ownership.title'),
      challenge: t('log.intent.challenge.title'),
    },
    outcomeLabel: {
      deadline_met: t('log.outcome.deadlineMet.title'),
      error_fixed_or_prevented: t('log.outcome.errorFixed.title'),
      work_faster: t('log.outcome.workFaster.title'),
      work_clearer: t('log.outcome.workClearer.title'),
      person_helped: t('log.outcome.personHelped.title'),
      risk_reduced: t('log.outcome.riskReduced.title'),
      decision_enabled: t('log.outcome.decisionEnabled.title'),
      skill_gained: t('log.outcome.skillGained.title'),
    },
    outcomePrefix: t('log.impact.outcomePrefix'),
    evidencePrefix: t('log.impact.evidencePrefix'),
  };
}
