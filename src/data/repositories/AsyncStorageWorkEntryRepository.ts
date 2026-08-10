import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type CreateWorkEntry,
  ENTRY_STATUSES,
  ENTRY_TYPES,
  EVIDENCE_TYPES,
  OUTCOME_TYPES,
  type WorkEntry,
  type WorkEntryEvidence,
} from '@/domain/entry/model';
import type { WorkEntryRepository } from '@/domain/entry/repository';

const WORK_ENTRIES_STORAGE_KEY = '@kerjalog/work-entries/v1';

let writeQueue = Promise.resolve();

/**
 * Transitional local adapter for the first Log slice.
 *
 * Keep all callers behind WorkEntryRepository so this can be replaced by the
 * architecture's SQLCipher-backed SQLite implementation without changing the
 * feature layer. AsyncStorage does not satisfy the production encryption
 * requirement and must not be treated as the final persisted source of truth.
 */
export class AsyncStorageWorkEntryRepository implements WorkEntryRepository {
  async findById(id: string): Promise<WorkEntry | null> {
    const entries = await readEntries();
    return entries.find((entry) => entry.id === id) ?? null;
  }

  async findRecent(limit: number): Promise<WorkEntry[]> {
    if (!Number.isInteger(limit) || limit < 0) {
      throw new Error(
        'Recent work entry limit must be a non-negative integer.',
      );
    }

    const entries = await readEntries();
    return [...entries]
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, limit);
  }

  async create(input: CreateWorkEntry): Promise<WorkEntry> {
    return enqueueWrite(async () => {
      const entries = await readEntries();
      const now = new Date().toISOString();
      const entry: WorkEntry = {
        ...input,
        id: createLocalId(now),
        createdAt: now,
        updatedAt: now,
      };

      await AsyncStorage.setItem(
        WORK_ENTRIES_STORAGE_KEY,
        JSON.stringify([...entries, entry]),
      );

      return entry;
    });
  }
}

async function readEntries(): Promise<WorkEntry[]> {
  const serialized = await AsyncStorage.getItem(WORK_ENTRIES_STORAGE_KEY);
  if (!serialized) {
    return [];
  }

  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed) || !parsed.every(isWorkEntry)) {
    throw new Error('Stored work entries are invalid.');
  }

  return parsed;
}

function isWorkEntry(value: unknown): value is WorkEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    isOneOf(value.type, ENTRY_TYPES) &&
    typeof value.title === 'string' &&
    typeof value.rawNote === 'string' &&
    (typeof value.impactStatement === 'string' ||
      value.impactStatement === null) &&
    typeof value.occurredAt === 'string' &&
    (isOneOf(value.outcomeType, OUTCOME_TYPES) || value.outcomeType === null) &&
    isOneOf(value.status, ENTRY_STATUSES) &&
    (isEvidence(value.evidence) || value.evidence === null) &&
    typeof value.excludedFromExports === 'boolean' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isEvidence(value: unknown): value is WorkEntryEvidence {
  if (!isRecord(value) || !Array.isArray(value.types)) {
    return false;
  }

  return (
    value.types.every((type) => isOneOf(type, EVIDENCE_TYPES)) &&
    typeof value.detail === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOneOf<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
): value is Values[number] {
  return typeof value === 'string' && values.includes(value as Values[number]);
}

function createLocalId(timestamp: string): string {
  const timePart = Date.parse(timestamp).toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${timePart}-${randomPart}`;
}

function enqueueWrite<Result>(
  operation: () => Promise<Result>,
): Promise<Result> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
