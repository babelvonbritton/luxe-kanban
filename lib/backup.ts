/**
 * Backup & restore: JSON per-store dikompres menjadi satu ZIP (fflate).
 *
 * Isi arsip backup (persis mengikuti struktur granular LocalStorage):
 *   manifest.json       → info backup (app, schemaVersion, exportedAt, counts)
 *   tasks-todo.json     → StoreFile<Task[]>
 *   tasks-doing.json    → StoreFile<Task[]>
 *   tasks-done.json     → StoreFile<Task[]>
 */
import { unzipSync, zipSync, strToU8 } from 'fflate';
import { SCHEMA_VERSION, StoreFile, serializeStore } from './storage';
import { isStatus, Status, Task } from './types';

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

export const MANIFEST_FILE = 'manifest.json';
export const backupTaskFileName = (status: Status) => `tasks-${status}.json`;
export const BACKUP_ENTRY_NAMES: readonly string[] = [
  MANIFEST_FILE,
  'tasks-todo.json',
  'tasks-doing.json',
  'tasks-done.json',
];

export interface BackupManifest {
  app: 'luxe-kanban';
  schemaVersion: number;
  exportedAt: string;
  counts: { todo: number; doing: number; done: number; total: number };
}

export function buildManifest(
  board: Record<Status, Task[]>,
  exportedAt: Date = new Date(),
): BackupManifest {
  const counts = {
    todo: board.todo.length,
    doing: board.doing.length,
    done: board.done.length,
    total: board.todo.length + board.doing.length + board.done.length,
  };
  return { app: 'luxe-kanban', schemaVersion: SCHEMA_VERSION, exportedAt: exportedAt.toISOString(), counts };
}

/** Kompres semua store menjadi ZIP. */
export function buildBackupZip(
  board: Record<Status, Task[]>,
  exportedAt: Date = new Date(),
): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  files[MANIFEST_FILE] = strToU8(JSON.stringify(buildManifest(board, exportedAt), null, 2));
  for (const status of Object.keys(board) as Status[]) {
    const store: StoreFile<Task> = serializeStore(board[status], exportedAt);
    files[backupTaskFileName(status)] = strToU8(JSON.stringify(store, null, 2));
  }
  return zipSync(files, { level: 6 });
}

/** Tanda tangan ZIP: "PK\x03\x04" (local file header). */
export function zipSignatureOk(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export interface ExtractedBackup {
  manifest: unknown;
  entries: Record<string, unknown>;
}

/** TAHAP VERIFIKASI: bongkar ZIP & pastikan arsip lengkap. */
export function unzipBackup(bytes: Uint8Array): ExtractedBackup {
  if (!zipSignatureOk(bytes)) {
    throw new BackupError('File tidak dikenali sebagai arsip ZIP yang valid.');
  }
  let unzipped: Record<string, Uint8Array>;
  try {
    unzipped = unzipSync(bytes);
  } catch {
    throw new BackupError('Arsip ZIP tidak dapat dibuka — kemungkinan file rusak di tengah jalan.');
  }
  const entries: Record<string, unknown> = {};
  for (const name of BACKUP_ENTRY_NAMES) {
    const data = unzipped[name];
    if (!data) {
      throw new BackupError(`Arsip backup tidak lengkap: entri "${name}" tidak ditemukan.`);
    }
    try {
      entries[name] = JSON.parse(new TextDecoder().decode(data));
    } catch {
      throw new BackupError(`Entri "${name}" di dalam arsip bukan JSON yang valid.`);
    }
  }
  return { manifest: entries[MANIFEST_FILE], entries };
}

/** Validasi satu tugas dengan konteks file agar pesan error jelas. */
export function assertTask(value: unknown, ctx: string): Task {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BackupError(`${ctx}: item bukan objek tugas.`);
  }
  const t = value as Record<string, unknown>;
  const requireString = (key: string, allowEmpty = false) => {
    const v = t[key];
    if (typeof v !== 'string' || (!allowEmpty && v.trim() === '')) {
      throw new BackupError(`${ctx}: properti "${key}" harus berupa teks${allowEmpty ? '' : ' yang tidak kosong'}.`);
    }
    return v;
  };
  requireString('id');
  requireString('title');
  requireString('description', true);
  const status = requireString('status');
  if (!isStatus(status)) {
    throw new BackupError(`${ctx}: status "${status}" tidak dikenal (harus todo/doing/done).`);
  }
  const createdAt = requireString('createdAt');
  const updatedAt = requireString('updatedAt');
  if (Number.isNaN(new Date(createdAt).getTime()) || Number.isNaN(new Date(updatedAt).getTime())) {
    throw new BackupError(`${ctx}: tanggal createdAt/updatedAt tidak valid.`);
  }
  return {
    id: t.id as string,
    title: t.title as string,
    description: t.description as string,
    status: status as Status,
    createdAt,
    updatedAt,
  };
}

/** TAHAP VALIDASI: periksa struktur tiap store, kembalikan board siap muat. */
export function validateBackup(extracted: ExtractedBackup): Record<Status, Task[]> {
  const board: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
  const seenIds = new Set<string>();

  for (const status of ['todo', 'doing', 'done'] as Status[]) {
    const name = backupTaskFileName(status);
    const raw = extracted.entries[name];
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new BackupError(`File "${name}" harus berupa objek store.`);
    }
    const obj = raw as Record<string, unknown>;
    if (obj.version !== SCHEMA_VERSION) {
      throw new BackupError(
        `File "${name}" memakai versi data ${String(obj.version)} — aplikasi ini memakai versi ${SCHEMA_VERSION}.`,
      );
    }
    if (!Array.isArray(obj.items)) {
      throw new BackupError(`File "${name}" tidak memiliki daftar "items".`);
    }
    for (const [i, item] of (obj.items as unknown[]).entries()) {
      const task = assertTask(item, `File "${name}" item #${i + 1}`);
      if (seenIds.has(task.id)) {
        throw new BackupError(`File "${name}" item #${i + 1}: ID tugas "${task.id}" duplikat di dalam backup.`);
      }
      seenIds.add(task.id);
      // Tempatkan sesuai nama file (sumber kebenaran), bukan field status di dalam item.
      board[status].push({ ...task, status });
    }
  }
  return board;
}

export function countBoardTasks(board: Record<Status, Task[]>): number {
  return board.todo.length + board.doing.length + board.done.length;
}
