import type { WorkArea } from '@/domain/work-area/model';

export interface WorkAreaReader {
  listActive(): Promise<WorkArea[]>;
  listAll(): Promise<WorkArea[]>;
}

export interface WorkAreaWriter {
  create(name: string): Promise<WorkArea>;
  rename(id: string, name: string): Promise<WorkArea>;
  archive(id: string): Promise<void>;
}

export interface WorkAreaRepository extends WorkAreaReader, WorkAreaWriter {}
