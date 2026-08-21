import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeProvider';
import type { GrowthEvidenceMap } from '@/domain/growth/model';
import { GrowthEvidenceMapContent } from '@/features/growth/components/GrowthEvidenceMapContent';
import { SkillEvidenceContent } from '@/features/growth/components/SkillEvidenceContent';

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@/i18n/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    t: (key: string, params?: Record<string, string | number>) =>
      params?.count === undefined ? key : `${key}:${params.count}`,
  }),
}));

const evidenceMap: GrowthEvidenceMap = {
  totalEntries: 4,
  skills: [
    {
      skillId: 'attention_to_detail',
      entryCount: 2,
    },
    {
      skillId: 'leadership',
      entryCount: 0,
    },
  ],
};

describe('Growth evidence presentation', () => {
  test('keeps supporting skills actionable and zero-evidence skills non-judgmental', async () => {
    const openSkill = jest.fn();

    await render(
      <ThemeProvider>
        <GrowthEvidenceMapContent
          state={{
            status: 'loaded',
            evidenceMap,
            isRefreshing: false,
            refreshError: false,
          }}
          onRetry={jest.fn()}
          onOpenSkill={openSkill}
        />
      </ThemeProvider>,
    );

    const attention = screen.getByRole('button', {
      name: /skill\.attentionToDetail.*growth\.skill\.entryMany:2/,
    });
    const leadership = screen.getByRole('button', {
      name: /skill\.leadership.*growth\.skill\.none/,
    });

    expect(attention.props.accessibilityState).toEqual({ disabled: false });
    expect(leadership.props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByText('growth.guidance.title')).toBeTruthy();

    fireEvent.press(attention);
    fireEvent.press(leadership);

    expect(openSkill).toHaveBeenCalledTimes(1);
    expect(openSkill).toHaveBeenCalledWith('attention_to_detail');
  });

  test('exposes an accessible loading state', async () => {
    await render(
      <ThemeProvider>
        <GrowthEvidenceMapContent
          state={{ status: 'loading' }}
          onRetry={jest.fn()}
          onOpenSkill={jest.fn()}
        />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('progressbar', { name: 'growth.loading' }),
    ).toBeTruthy();
  });

  test('opens the saved entry behind a virtualized skill evidence item', async () => {
    const openEntry = jest.fn();

    await render(
      <ThemeProvider>
        <SkillEvidenceContent
          locale="en-US"
          state={{
            status: 'loaded',
            entries: [
              {
                id: 'entry-1',
                title: 'Resolved reconciliation discrepancies',
                occurredAt: '2026-08-20T08:00:00.000Z',
                supportingText:
                  'Removed 7 duplicate entries before submission.',
              },
            ],
            isRefreshing: false,
            refreshError: false,
          }}
          onRetry={jest.fn()}
          onOpenEntry={openEntry}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('growth.detail.coverageTitle')).toBeTruthy();
    fireEvent.press(
      screen.getByRole('button', {
        name: /Resolved reconciliation discrepancies/,
      }),
    );

    expect(openEntry).toHaveBeenCalledWith('entry-1');
  });
});
