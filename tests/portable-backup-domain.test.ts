import {
  getPortableBackupSummary,
  parsePortableBackup,
  parsePortableBackupJson,
  type PortableBackup,
} from '@/domain/portability/model';

function createBackup(): PortableBackup {
  return {
    version: 1,
    exportedAt: '2026-09-12T08:00:00.000Z',
    data: {
      workAreas: [
        {
          id: 'area-1',
          name: 'Operations',
          archivedAt: null,
          createdAt: '2026-09-01T08:00:00.000Z',
          updatedAt: '2026-09-01T08:00:00.000Z',
        },
      ],
      entries: [
        {
          id: 'entry-private',
          type: 'contribution',
          title: 'Prepared report',
          rawNote: 'Prepared the weekly report.',
          impactStatement: 'Prepared the weekly report on time.',
          impactStatementSource: 'user',
          occurredAt: '2026-09-02T08:00:00.000Z',
          outcomeType: 'deadline_met',
          status: 'review_ready',
          workAreaId: 'area-1',
          evidence: { types: ['deadline'], detail: 'Submitted Friday.' },
          excludedFromExports: true,
          createdAt: '2026-09-02T08:00:00.000Z',
          updatedAt: '2026-09-02T08:00:00.000Z',
          skills: [{ id: 'execution', source: 'user' }],
        },
      ],
      activeDraft: {
        draft: {
          step: 'skills',
          intent: 'completed',
          rawNote: 'Prepared the weekly report.',
          workAreaId: 'area-1',
          outcomeType: 'deadline_met',
          evidenceTypes: ['deadline'],
          evidenceDetail: 'Submitted Friday.',
          skills: [{ id: 'execution', source: 'user' }],
          impactStatement: '',
          impactStatementSource: null,
        },
        updatedAt: '2026-09-02T08:00:00.000Z',
      },
      reviewDrafts: [
        {
          id: 'review-1',
          title: 'September review',
          purpose: 'performance_self_review',
          period: { startDate: '2026-09-01', endDate: '2026-09-30' },
          document: {
            sections: [
              {
                id: 'highlights',
                title: 'Highlights',
                bullets: ['Prepared the weekly report on time.'],
              },
            ],
          },
          entries: [
            {
              sourceEntryId: 'entry-private',
              title: 'Prepared report',
              statement: 'Prepared the weekly report on time.',
              evidenceDetail: 'Submitted Friday.',
              occurredAt: '2026-09-02T08:00:00.000Z',
              sortOrder: 0,
            },
          ],
          createdAt: '2026-09-03T08:00:00.000Z',
          updatedAt: '2026-09-03T08:00:00.000Z',
        },
      ],
      preferences: {
        themeMode: 'dark',
        language: 'id',
        onboarding: {
          version: 1,
          currentStep: 'review-rhythm',
          completed: true,
          workArea: 'operations-administration',
          careerLevel: 'junior-contributor',
          mainGoal: 'performance-review',
          reviewSchedule: 'within-3-months',
          weeklyReminderEnabled: true,
          weeklyReminderSchedule: { weekday: 6, hour: 16, minute: 30 },
        },
      },
    },
  };
}

describe('portable backup domain', () => {
  test('validates a complete backup and preserves private entries', () => {
    const backup = parsePortableBackup(createBackup());

    expect(backup.data.entries[0]?.excludedFromExports).toBe(true);
    expect(getPortableBackupSummary(backup)).toEqual({
      workAreas: 1,
      entries: 1,
      reviewDrafts: 1,
    });
  });

  test('rejects malformed and unsupported payloads before import', () => {
    expect(() => parsePortableBackupJson('{not json')).toThrow(
      'Portable backup is invalid or unsupported.',
    );
    expect(() =>
      parsePortableBackup({ ...createBackup(), version: 2 }),
    ).toThrow('Portable backup is invalid or unsupported.');
  });

  test('rejects broken references rather than changing data', () => {
    const backup = createBackup();
    const entry = backup.data.entries[0];
    if (!entry) {
      throw new Error('Expected backup fixture entry.');
    }
    backup.data.entries[0] = {
      ...entry,
      workAreaId: 'missing-area',
    };

    expect(() => parsePortableBackup(backup)).toThrow(
      'Portable backup entry references an unknown work area.',
    );
  });
});
