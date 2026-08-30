import { renderHook, waitFor } from '@testing-library/react-native';
import type { WorkEntry } from '@/domain/entry/model';
import type { RecentWorkEntryReader } from '@/domain/entry/repository';
import { getStartOfLocalWeekIso } from '@/features/home/homePeriod';
import { useHomeWorkEntries } from '@/features/home/useHomeWorkEntries';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');

  return {
    useFocusEffect: (effect: import('react').EffectCallback) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const recentEntry: WorkEntry = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Prepared the weekly report',
  rawNote: 'Prepared the weekly report',
  impactStatement: null,
  occurredAt: '2026-08-11T00:00:00.000Z',
  outcomeType: null,
  status: 'quick_note',
  workAreaId: null,
  evidence: null,
  excludedFromExports: false,
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
};

function createRepository(): jest.Mocked<RecentWorkEntryReader> {
  return {
    findRecent: jest.fn().mockResolvedValue([recentEntry]),
    countSince: jest.fn().mockResolvedValue(4),
  };
}

describe('home work entry data', () => {
  test('derives Monday midnight in the device local timezone', () => {
    const now = new Date(2026, 7, 12, 14, 30, 0, 0);
    const start = new Date(getStartOfLocalWeekIso(now));

    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(10);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  test('loads recent entries and this-week count through the read capability', async () => {
    const repository = createRepository();
    const { result } = await renderHook(() => useHomeWorkEntries(repository));

    await waitFor(() => expect(result.current.status).toBe('loaded'));

    expect(repository.findRecent).toHaveBeenCalledWith(3);
    expect(repository.countSince).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/u),
    );
    expect(result.current).toEqual({
      status: 'loaded',
      recentEntries: [recentEntry],
      thisWeekCount: 4,
    });
  });

  test('surfaces repository failures without pretending the data is empty', async () => {
    const repository = createRepository();
    repository.findRecent.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    const { result } = await renderHook(() => useHomeWorkEntries(repository));

    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current).toEqual({ status: 'error' });
  });
});
