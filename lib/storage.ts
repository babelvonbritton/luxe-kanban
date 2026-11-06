/**
 * Penyimpanan granular berbasis LocalStorage.
 *
 * Satu store (file logis) per status kolom, sehingga backup/restore mudah
 * dilakukan per-bagian dan strukturnya persis seperti isi arsip ZIP:
 *
 *   luxekanban.meta              → BoardMeta (riwayat backup/restore)
 *   luxekanban.v1.tasks.todo     → StoreFile<Task[]>
 *   luxekanban.v1.tasks.doing    → StoreFile<Task[]>
 *   luxekanban.v1.tasks.done     → StoreFile<Task[]>
 */
import { isStatus, STATUSES, Status, Task } from './types';
import { generateId, nowIso } from './utils';

export const SCHEMA_VERSION = 1;

export const storageKeys = {
  meta: 'luxekanban.meta',
  legacyTasks: 'luxekanban.tasks',
  tasks: (status: Status) => `luxekanban.v1.tasks.${status}`,
};

/** Antarmuka minimal agar bisa diuji tanpa browser. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Bentuk satu "file" store di LocalStorage maupun di dalam ZIP. */
export interface StoreFile<T> {
  version: number;
  updatedAt: string;
  items: T[];
}

export interface BoardMeta {
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  restoredTaskCount: number | null;
}

export const EMPTY_META: BoardMeta = {
  lastBackupAt: null,
  lastRestoreAt: null,
  restoredTaskCount: null,
};

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export function serializeStore<T>(items: T[], now: Date = new Date()): StoreFile<T> {
  return { version: SCHEMA_VERSION, updatedAt: nowIso(now), items };
}

/** Parse + validasi struktur satu store; label dipakai dalam pesan error. */
export function parseStore<T>(raw: string, label: string): StoreFile<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError(`Isi store "${label}" bukan JSON yang valid.`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new StorageError(`Store "${label}" harus berupa objek.`);
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== SCHEMA_VERSION) {
    throw new StorageError(
      `Store "${label}" memakai versi data ${String(obj.version)}, aplikasi memakai versi ${SCHEMA_VERSION}.`,
    );
  }
  if (!Array.isArray(obj.items)) {
    throw new StorageError(`Store "${label}" tidak memiliki daftar "items".`);
  }
  return {
    version: SCHEMA_VERSION,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : '',
    items: obj.items as T[],
  };
}

/** Muat satu kolom; item rusak di-skip agar board tidak ikut mati. */
export function loadStatusTasks(storage: StorageLike, status: Status): Task[] {
  const raw = storage.getItem(storageKeys.tasks(status));
  if (raw === null) return [];
  try {
    const store = parseStore<Task>(raw, `tasks.${status}`);
    return store.items.filter((t): t is Task => isValidTaskShallow(t));
  } catch (error) {
    console.warn(`[luxe-kanban] Lewati store ${status}:`, error);
    return [];
  }
}

function isValidTaskShallow(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.title === 'string' && isStatus(t.status);
}

export function saveStatusTasks(storage: StorageLike, status: Status, tasks: Task[]): void {
  storage.setItem(storageKeys.tasks(status), JSON.stringify(serializeStore(tasks)));
}

export function readLegacyTasks(storage: StorageLike): Task[] | null {
  const raw = storage.getItem(storageKeys.legacyTasks);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as { items?: unknown };
    if (Array.isArray(parsed?.items)) {
      return parsed.items.filter((t): t is Task => isValidTaskShallow(t));
    }
  } catch {
    /* key lama rusak — abaikan */
  }
  return null;
}

/** Baca seluruh board dari store granular (+ merge key legacy lama bila ada). */
export function readAllTasks(storage: StorageLike): Record<Status, Task[]> {
  const board = { todo: [], doing: [], done: [] } as Record<Status, Task[]>;
  for (const status of STATUSES) {
    board[status] = loadStatusTasks(storage, status);
  }
  const legacy = readLegacyTasks(storage);
  if (legacy) {
    const seen = new Set(board.todo.concat(board.doing, board.done).map((t) => t.id));
    for (const task of legacy) {
      if (!seen.has(task.id) && isStatus(task.status)) {
        board[task.status].push(task);
        seen.add(task.id);
      }
    }
  }
  return board;
}

/** Tulis seluruh board secara granular + bersihkan key legacy. */
export function writeAllTasks(storage: StorageLike, board: Record<Status, Task[]>): void {
  for (const status of STATUSES) {
    saveStatusTasks(storage, status, board[status]);
  }
  storage.removeItem(storageKeys.legacyTasks);
}

export function readMeta(storage: StorageLike): BoardMeta {
  const raw = storage.getItem(storageKeys.meta);
  if (raw === null) return { ...EMPTY_META };
  try {
    const parsed = JSON.parse(raw) as Partial<BoardMeta>;
    return {
      lastBackupAt: typeof parsed.lastBackupAt === 'string' ? parsed.lastBackupAt : null,
      lastRestoreAt: typeof parsed.lastRestoreAt === 'string' ? parsed.lastRestoreAt : null,
      restoredTaskCount: typeof parsed.restoredTaskCount === 'number' ? parsed.restoredTaskCount : null,
    };
  } catch {
    return { ...EMPTY_META };
  }
}

export function writeMeta(storage: StorageLike, meta: BoardMeta): void {
  storage.setItem(storageKeys.meta, JSON.stringify(meta));
}

export interface MigrationResult {
  seeded: boolean;
  migrated: boolean;
  taskCount: number;
}

/**
 * Pastikan storage siap dipakai:
 *  - punya key legacy → pindahkan ke store granular (migrasi).
 *  - kosong total      → isi data contoh.
 *  - sudah granular    → biarkan apa adanya.
 */
export function migrateIfNeeded(storage: StorageLike): MigrationResult {
  const legacy = readLegacyTasks(storage);
  if (legacy !== null) {
    const board = { todo: [], doing: [], done: [] } as Record<Status, Task[]>;
    for (const task of legacy) {
      if (isStatus(task.status)) board[task.status].push(task);
    }
    writeAllTasks(storage, board);
    return { seeded: false, migrated: true, taskCount: legacy.length };
  }

  const hasGranular = STATUSES.some((s) => storage.getItem(storageKeys.tasks(s)) !== null);
  if (!hasGranular) {
    const seeded = createSeedBoard();
    writeAllTasks(storage, seeded);
    writeMeta(storage, { ...EMPTY_META });
    return { seeded: true, migrated: false, taskCount: countBoard(seeded) };
  }

  const board = readAllTasks(storage);
  return { seeded: false, migrated: false, taskCount: countBoard(board) };
}

export function countBoard(board: Record<Status, Task[]>): number {
  return board.todo.length + board.doing.length + board.done.length;
}

/** Data contoh saat pertama kali dibuka. */
export function createSeedBoard(now: Date = new Date()): Record<Status, Task[]> {
  const hour = 3600 * 1000;
  const at = (h: number) => new Date(now.getTime() - h * hour).toISOString();
  const mk = (
    id: string,
    title: string,
    description: string,
    status: Status,
    h: number,
  ): Task => ({ id, title, description, status, createdAt: at(h), updatedAt: at(h) });

  return {
    todo: [
      mk('tsk-demo-1', 'Riset palet warna & tipografi mewah', 'Kumpulkan 3 referensi kombinasi emas–onyx untuk identitas papan tugas.', 'todo', 6),
      mk('tsk-demo-2', 'Susun agenda weekly review', 'Buat template agenda 30 menit untuk evaluasi progres proyek setiap Jumat.', 'todo', 8),
    ],
    doing: [
      mk('tsk-demo-3', 'Draf konsep halaman utama', 'Susun wireframe kartu kanban dengan aksen emas dan tipografi serif.', 'doing', 4),
      mk('tsk-demo-4', 'Pilih font serif premium', 'Bandingkan Cormorant Garamond dan Playfair Display untuk judul kartu.', 'doing', 5),
    ],
    done: [
      mk('tsk-demo-5', 'Siapkan ruang kerja digital', 'Bersihkan desktop dan aktifkan mode fokus sebelum memulai proyek.', 'done', 24),
      mk('tsk-demo-6', 'Tentukan nama proyek', 'Bulatkan nama “Luxe Kanban” beserta tagline resminya.', 'done', 30),
    ],
  };
}

/** ID cadangan jika seed dimodifikasi agar tetap unik. */
export function reserveId(prefix: string): string {
  return generateId() || prefix;
}
