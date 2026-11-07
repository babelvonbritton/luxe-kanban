/**
 * Orkestrasi operasi backup/restore — dipanggil dari UI dengan pelapor tahapan.
 * Pacing & visualisasi ada di useApiOperation; modul ini fokus pada logika.
 */
import {
  BackupError,
  buildBackupZip,
  unzipBackup,
  validateBackup,
  countBoardTasks,
} from '@/lib/backup';
import {
  readAllTasks,
  writeAllTasks,
  writeMeta,
  readMeta,
  StorageLike,
} from '@/lib/storage';
import { Task, Status } from '@/lib/types';
import { nowIso } from '@/lib/utils';
import { StepEvent } from '@/app/ui/useApiOperation';

export interface BackupResult {
  fileName: string;
  zipBytes: Uint8Array;
  totalTasks: number;
}

type Locale = 'id' | 'en-US';

/** BACKUP: kumpulkan → ZIP (kompres) → unduh. */
export async function performBackup(
  storage: StorageLike,
  report: (e: StepEvent) => void,
  locale: Locale = 'id',
): Promise<BackupResult> {
  // Tahap 1: verifikasi — pastikan store granular dapat dibaca
  let board: Record<Status, Task[]>;
  try {
    board = readAllTasks(storage);
    const count = countBoardTasks(board);
    if (count === 0) {
      throw new BackupError('Papan masih kosong — tidak ada data untuk dibackup.');
    }
    report({
      id: 'verify',
      note: locale === 'en-US'
        ? `${count} ${count === 1 ? 'task' : 'tasks'} found across all three status columns.`
        : `${count} tugas terbaca dari 3 store granular (todo/doing/done).`,
    });
  } catch (error) {
    report({
      id: 'verify',
      error: error instanceof Error ? error.message : 'Store tidak dapat dibaca.',
    });
    throw error;
  }

  // Tahap 2: validasi data
  const counts = {
    todo: board.todo.length,
    doing: board.doing.length,
    done: board.done.length,
  };
  report({
    id: 'validate',
    note: locale === 'en-US'
      ? `To Do: ${counts.todo} · In Progress: ${counts.doing} · Done: ${counts.done} — all data stores are valid.`
      : `todo: ${counts.todo} · doing: ${counts.doing} · done: ${counts.done} — struktur store valid.`,
  });

  // Tahap 3: memuat data baru (kompres menjadi ZIP)
  const exportedAt = new Date();
  let zipBytes: Uint8Array;
  try {
    zipBytes = buildBackupZip(board, exportedAt);
  } catch (error) {
    report({
      id: 'load',
      error: error instanceof Error ? error.message : 'Kompresi ZIP gagal.',
    });
    throw error;
  }
  report({
    id: 'load',
    note: locale === 'en-US'
      ? `Archive created (${zipBytes.length.toLocaleString('en-US')} bytes).`
      : `Arsip dibuat (${zipBytes.length.toLocaleString('id-ID')} bytes).`,
  });

  // Tahap 4 (finish): catat meta + siapkan unduhan
  const meta = readMeta(storage);
  writeMeta(storage, { ...meta, lastBackupAt: nowIso(exportedAt) });

  const stamp = exportedAt.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return {
    fileName: `luxekanban-backup-${stamp}.zip`,
    zipBytes,
    totalTasks: countBoardTasks(board),
  };
}

/** RESTORE: verifikasi arsip → validasi isi → muat ke LocalStorage. */
export async function performRestore(
  storage: StorageLike,
  fileBytes: Uint8Array,
  fileName: string,
  report: (e: StepEvent) => void,
  locale: Locale = 'id',
): Promise<{ totalTasks: number }> {
  // Tahap 1: verifikasi arsip
  let extracted: ReturnType<typeof unzipBackup>;
  try {
    extracted = unzipBackup(fileBytes);
    report({
      id: 'verify',
      note: locale === 'en-US'
        ? `“${fileName}” opened — manifest and all three data stores found.`
        : `"${fileName}" terbuka — manifest + 3 store ditemukan.`,
    });
  } catch (error) {
    report({
      id: 'verify',
      error: error instanceof Error ? error.message : 'Arsip tidak dapat diverifikasi.',
    });
    throw error;
  }

  // Tahap 2: validasi data
  let board: Record<Status, Task[]>;
  try {
    board = validateBackup(extracted);
    const total = countBoardTasks(board);
    if (total === 0) {
      throw new BackupError('Backup tidak berisi satu tugas pun.');
    }
    report({
      id: 'validate',
      note: locale === 'en-US'
        ? `${total} ${total === 1 ? 'task' : 'tasks'} passed validation — unique IDs, recognized statuses, and valid dates.`
        : `${total} tugas lolos validasi — ID unik, status dikenal, tanggal valid.`,
    });
  } catch (error) {
    report({
      id: 'validate',
      error: error instanceof Error ? error.message : 'Data backup tidak valid.',
    });
    throw error;
  }

  // Tahap 3: muat data baru ke store granular (menimpa yang lama)
  try {
    writeAllTasks(storage, board);
    const meta = readMeta(storage);
    writeMeta(storage, {
      ...meta,
      lastRestoreAt: nowIso(),
      restoredTaskCount: countBoardTasks(board),
    });
    const count = countBoardTasks(board);
    report({
      id: 'load',
      note: locale === 'en-US'
        ? `${count} ${count === 1 ? 'task' : 'tasks'} saved to local storage.`
        : `${count} tugas tertulis ke store granular LocalStorage.`,
    });
  } catch (error) {
    report({
      id: 'load',
      error: error instanceof Error ? error.message : 'Penulisan ke LocalStorage gagal (penyimpanan penuh atau diblokir?).',
    });
    throw error;
  }

  return { totalTasks: countBoardTasks(board) };
}
