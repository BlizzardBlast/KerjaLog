import type { SQLiteDatabase } from 'expo-sqlite';
import {
  withKeyedDatabaseAccess,
  withKeyedTransaction,
} from '@/data/keyedTransaction';

function createDatabase() {
  const db = {
    withTransactionAsync: jest.fn(async (operation: () => Promise<void>) => {
      await operation();
    }),
  };

  return db as unknown as SQLiteDatabase;
}

describe('keyed database access', () => {
  test('runs transaction tasks on the same already-keyed database handle', async () => {
    const db = createDatabase();
    const task = jest.fn(async (transactionDb: SQLiteDatabase) => {
      expect(transactionDb).toBe(db);
      return 'saved';
    });

    await expect(withKeyedTransaction(db, task)).resolves.toBe('saved');

    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);
  });

  test('serializes reads behind an active encrypted write transaction', async () => {
    const order: string[] = [];
    let releaseWrite: (() => void) | undefined;
    const writeGate = new Promise<void>((resolve) => {
      releaseWrite = resolve;
    });
    const db = createDatabase();

    const write = withKeyedTransaction(db, async () => {
      order.push('write:start');
      await writeGate;
      order.push('write:end');
    });
    const read = withKeyedDatabaseAccess(async () => {
      order.push('read');
    });

    await Promise.resolve();
    expect(order).toEqual(['write:start']);

    releaseWrite?.();
    await Promise.all([write, read]);

    expect(order).toEqual(['write:start', 'write:end', 'read']);
  });

  test('serializes independent keyed database operations', async () => {
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withKeyedDatabaseAccess(async () => {
      order.push('first:start');
      await firstGate;
      order.push('first:end');
    });
    const second = withKeyedDatabaseAccess(async () => {
      order.push('second:start');
    });

    await Promise.resolve();
    expect(order).toEqual(['first:start']);

    releaseFirst?.();
    await Promise.all([first, second]);

    expect(order).toEqual(['first:start', 'first:end', 'second:start']);
  });
});
