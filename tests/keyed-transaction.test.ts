import type { SQLiteDatabase } from 'expo-sqlite';
import { withKeyedTransaction } from '@/data/keyedTransaction';

function createDatabase() {
  const db = {
    withTransactionAsync: jest.fn(async (operation: () => Promise<void>) => {
      await operation();
    }),
  };

  return db as unknown as SQLiteDatabase;
}

describe('withKeyedTransaction', () => {
  test('runs the task on the same already-keyed database handle', async () => {
    const db = createDatabase();
    const task = jest.fn(async (transactionDb: SQLiteDatabase) => {
      expect(transactionDb).toBe(db);
      return 'saved';
    });

    await expect(withKeyedTransaction(db, task)).resolves.toBe('saved');

    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);
  });

  test('serializes encrypted write transactions', async () => {
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const firstDb = createDatabase();
    const secondDb = createDatabase();

    const first = withKeyedTransaction(firstDb, async () => {
      order.push('first:start');
      await firstGate;
      order.push('first:end');
    });
    const second = withKeyedTransaction(secondDb, async () => {
      order.push('second:start');
    });

    await Promise.resolve();
    expect(order).toEqual(['first:start']);

    releaseFirst?.();
    await Promise.all([first, second]);

    expect(order).toEqual(['first:start', 'first:end', 'second:start']);
  });
});
