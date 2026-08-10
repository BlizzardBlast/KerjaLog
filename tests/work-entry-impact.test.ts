import {
  buildEntryTitle,
  buildImpactStatement,
  deriveEntryStatus,
  type ImpactBuilderCopy,
} from '@/domain/entry/impact';

const copy: ImpactBuilderCopy = {
  intentLead: {
    completed: 'I completed something',
    solved: 'I solved a problem',
    helped: 'I helped someone',
    feedback: 'I received feedback',
    learned: 'I learned something',
    ownership: 'I took responsibility',
    challenge: 'Something became difficult',
  },
  outcomeLabel: {
    deadline_met: 'A deadline was met',
    error_fixed_or_prevented: 'An error was fixed or prevented',
    work_faster: 'Work became faster',
    work_clearer: 'Work became clearer',
    person_helped: 'A customer or colleague was helped',
    risk_reduced: 'A risk was reduced',
    decision_enabled: 'A decision became possible',
    skill_gained: 'I gained a new skill',
  },
  outcomePrefix: 'Outcome',
  evidencePrefix: 'Evidence',
};

describe('work entry impact rules', () => {
  test('uses completeness states without scoring the entry', () => {
    expect(deriveEntryStatus(null)).toBe('quick_note');
    expect(deriveEntryStatus('unsure')).toBe('quick_note');
    expect(deriveEntryStatus('deadline_met')).toBe('developed');
    expect(deriveEntryStatus('deadline_met', 'Finished on Friday')).toBe(
      'review_ready',
    );
  });

  test('structures only facts the user supplied or confirmed', () => {
    const statement = buildImpactStatement(
      {
        intent: 'solved',
        rawNote: 'I removed duplicate rows from the monthly report',
        outcomeType: 'error_fixed_or_prevented',
        evidenceDetail: '7 duplicate rows were removed',
      },
      copy,
    );

    expect(statement).toBe(
      'I solved a problem: I removed duplicate rows from the monthly report. Outcome: An error was fixed or prevented. Evidence: 7 duplicate rows were removed.',
    );
    expect(statement).not.toContain('revenue');
    expect(statement).not.toContain('%');
  });

  test('does not manufacture an outcome when the user is unsure', () => {
    expect(
      buildImpactStatement(
        {
          intent: 'completed',
          rawNote: 'Prepared the weekly status report',
          outcomeType: 'unsure',
        },
        copy,
      ),
    ).toBe('I completed something: Prepared the weekly status report.');
  });

  test('builds a concise title from the original note', () => {
    expect(
      buildEntryTitle('  Fixed the reconciliation mismatch. More detail.  '),
    ).toBe('Fixed the reconciliation mismatch');
    expect(buildEntryTitle('A'.repeat(90), 24)).toBe(`${'A'.repeat(23)}…`);
  });
});
