import * as Crypto from 'expo-crypto';
import { getDatabase } from '@/data/database';
import { SQLiteWorkAreaRepository } from '@/data/repositories/SQLiteWorkAreaRepository';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

jest.mock('@/data/database', () => ({
  getDatabase: jest.fn(),
}));

const getDatabaseMock = jest.mocked(getDatabase);
const randomUUIDMock = jest.mocked(Crypto.randomUUID);

describe('SQLiteWorkAreaRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a normalized active work area with bound parameters', async () => {
    randomUUIDMock.mockReturnValue('area-1');
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    getDatabaseMock.mockResolvedValue({
      runAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);
    const repository = new SQLiteWorkAreaRepository();

    const created = await repository.create('  Mobile   App Ａ  ');

    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO work_areas'),
      expect.objectContaining({
        $id: 'area-1',
        $name: 'Mobile App A',
        $nameKey: 'mobile app a',
      }),
    );
    expect(created).toMatchObject({
      id: 'area-1',
      name: 'Mobile App A',
      archivedAt: null,
    });
  });

  test('lists active work areas in persisted name order', async () => {
    const getAllAsync = jest.fn().mockResolvedValue([
      {
        id: 'area-a',
        name: 'Operations',
        archived_at: null,
        created_at: '2026-08-30T01:00:00.000Z',
        updated_at: '2026-08-30T01:00:00.000Z',
      },
    ]);
    getDatabaseMock.mockResolvedValue({
      getAllAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);
    const repository = new SQLiteWorkAreaRepository();

    await expect(repository.listActive()).resolves.toEqual([
      {
        id: 'area-a',
        name: 'Operations',
        archivedAt: null,
        createdAt: '2026-08-30T01:00:00.000Z',
        updatedAt: '2026-08-30T01:00:00.000Z',
      },
    ]);

    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE archived_at IS NULL'),
    );
  });

  test('renames only an active work area inside the keyed transaction', async () => {
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    const getFirstAsync = jest.fn().mockResolvedValue({
      id: 'area-a',
      name: 'Monthly Reporting',
      archived_at: null,
      created_at: '2026-08-30T01:00:00.000Z',
      updated_at: '2026-08-30T02:00:00.000Z',
    });
    const withTransactionAsync = jest.fn(
      async (operation: () => Promise<void>) => {
        await operation();
      },
    );
    getDatabaseMock.mockResolvedValue({
      runAsync,
      getFirstAsync,
      withTransactionAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);
    const repository = new SQLiteWorkAreaRepository();

    const renamed = await repository.rename(
      'area-a',
      '  Monthly   Reporting  ',
    );

    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $id AND archived_at IS NULL'),
      expect.objectContaining({
        $id: 'area-a',
        $name: 'Monthly Reporting',
        $nameKey: 'monthly reporting',
      }),
    );
    expect(renamed.name).toBe('Monthly Reporting');
  });

  test('archives without deleting historical work-area data', async () => {
    const runAsync = jest.fn().mockResolvedValue({ changes: 1 });
    getDatabaseMock.mockResolvedValue({
      runAsync,
    } as unknown as Awaited<ReturnType<typeof getDatabase>>);
    const repository = new SQLiteWorkAreaRepository();

    await repository.archive('area-a');

    expect(runAsync).toHaveBeenCalledWith(
      expect.stringContaining(
        'SET archived_at = $archivedAt, updated_at = $archivedAt',
      ),
      expect.objectContaining({ $id: 'area-a' }),
    );
  });
});
