import {
  type JoinedWorkEntryRow,
  mapJoinedWorkEntryRows,
} from '@/data/repositories/workEntryRowMapper';

const baseRow: JoinedWorkEntryRow = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Helped Finance',
  raw_note: 'Helped Finance reconcile the monthly report.',
  impact_statement: 'Helped Finance reconcile the monthly report.',
  occurred_at: '2026-08-10T08:00:00.000Z',
  outcome_type: 'person_helped',
  status: 'review_ready',
  excluded_from_exports: 0,
  created_at: '2026-08-10T08:01:00.000Z',
  updated_at: '2026-08-10T08:01:00.000Z',
  evidence_type: 'deadline',
  evidence_text_value: 'Completed before Friday close',
};

describe('mapJoinedWorkEntryRows', () => {
  test('reconstructs evidence in stable domain order', () => {
    const entries = mapJoinedWorkEntryRows([
      {
        ...baseRow,
        evidence_type: 'result',
      },
      baseRow,
    ]);

    expect(entries[0]?.evidence).toEqual({
      types: ['deadline', 'result'],
      detail: 'Completed before Friday close',
    });
  });

  test('rejects an evidence type without supporting detail', () => {
    expect(() =>
      mapJoinedWorkEntryRows([
        {
          ...baseRow,
          evidence_text_value: null,
        },
      ]),
    ).toThrow('Stored evidence is incomplete.');
  });

  test('rejects blank persisted evidence detail', () => {
    expect(() =>
      mapJoinedWorkEntryRows([
        {
          ...baseRow,
          evidence_text_value: '   ',
        },
      ]),
    ).toThrow('Stored evidence text value is invalid.');
  });

  test('rejects empty required work entry fields', () => {
    expect(() =>
      mapJoinedWorkEntryRows([
        {
          ...baseRow,
          title: '   ',
        },
      ]),
    ).toThrow('Stored work entry title is invalid.');
  });

  test('rejects malformed persisted timestamps', () => {
    expect(() =>
      mapJoinedWorkEntryRows([
        {
          ...baseRow,
          occurred_at: 'yesterday',
        },
      ]),
    ).toThrow('Stored work entry occurred at is invalid.');
  });
});
