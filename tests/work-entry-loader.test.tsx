import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { WorkEntry } from '@/domain/entry/model';
import type { WorkEntryByIdReader } from '@/domain/entry/repository';
import { useWorkEntry } from '@/features/work-entry/useWorkEntry';

const entry: WorkEntry = {
  id: 'entry-1',
  type: 'contribution',
  title: 'Prepared the report',
  rawNote: 'Prepared the report',
  impactStatement: null,
  occurredAt: '2026-08-11T00:00:00.000Z',
  outcomeType: null,
  status: 'quick_note',
  evidence: null,
  excludedFromExports: false,
  createdAt: '2026-08-11T00:00:00.000Z',
  updatedAt: '2026-08-11T00:00:00.000Z',
};

describe('useWorkEntry', () => {
  test('distinguishes a missing entry from a read failure', async () => {
    const missingRepository: WorkEntryByIdReader = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const { result: missing } = await renderHook(() =>
      useWorkEntry('entry-1', missingRepository),
    );

    await waitFor(() => expect(missing.current.state.status).toBe('not-found'));

    const failingRepository: WorkEntryByIdReader = {
      findById: jest.fn().mockRejectedValue(new Error('database unavailable')),
    };
    const { result: failing } = await renderHook(() =>
      useWorkEntry('entry-1', failingRepository),
    );

    await waitFor(() => expect(failing.current.state.status).toBe('error'));
  });

  test('retries the repository read after an error', async () => {
    const repository: WorkEntryByIdReader = {
      findById: jest
        .fn()
        .mockRejectedValueOnce(new Error('temporary read failure'))
        .mockResolvedValueOnce(entry),
    };
    const { result } = await renderHook(() =>
      useWorkEntry('entry-1', repository),
    );

    await waitFor(() => expect(result.current.state.status).toBe('error'));

    await act(async () => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.state.status).toBe('loaded'));
    expect(repository.findById).toHaveBeenCalledTimes(2);
  });
});
