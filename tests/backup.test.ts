import { describe, expect, it } from 'vitest';
import {
  assertTask,
  BackupError,
  backupTaskFileName,
  buildBackupZip,
  buildManifest,
  unzipBackup,
  validateBackup,
  zipSignatureOk,
} from '@/lib/backup';
import { serializeStore } from '@/lib/storage';
import { Status, Task } from '@/lib/types';
import { strToU8, zipSync } from 'fflate';

function mk(id: string, status: Status, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Tugas ${id}`,
    description: '',
    status,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function boardWith(...tasks: Task[]) {
  const board: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
  for (const t of tasks) board[t.status].push(t);
  return board;
}

function validZip(board = boardWith(mk('1', 'todo'), mk('2', 'doing'), mk('3', 'done'))): Uint8Array {
  return buildBackupZip(board, new Date('2026-05-05T00:00:00Z'));
}

describe('buildBackupZip', () => {
  it('menghasilkan ZIP dengan tanda tangan PK dan ter-bongkar utuh', () => {
    const zip = validZip();
    expect(zipSignatureOk(zip)).toBe(true);
    const { manifest, entries } = unzipBackup(zip);
    const m = manifest as { app: string; schemaVersion: number; counts: { total: number } };
    expect(m.app).toBe('luxe-kanban');
    expect(m.schemaVersion).toBe(1);
    expect(m.counts.total).toBe(3);
    expect(Object.keys(entries).sort()).toEqual(
      ['manifest.json', 'tasks-done.json', 'tasks-doing.json', 'tasks-todo.json'].sort(),
    );
  });

  it('nama file store mengikuti status', () => {
    expect(backupTaskFileName('todo')).toBe('tasks-todo.json');
    expect(backupTaskFileName('done')).toBe('tasks-done.json');
  });
});

describe('unzipBackup — tahap verifikasi', () => {
  it('menolak file yang bukan ZIP', () => {
    expect(() => unzipBackup(strToU8('ini bukan zip'))).toThrow(BackupError);
    expect(() => unzipBackup(new Uint8Array([0, 1, 2, 3]))).toThrow(BackupError);
  });

  it('menolak ZIP rusak (truncated)', () => {
    const zip = validZip();
    expect(() => unzipBackup(zip.slice(0, 40))).toThrow(BackupError);
  });

  it('menolak ZIP tanpa entri wajib', () => {
    const zip = zipSync({ 'random.txt': strToU8('halo') });
    expect(() => unzipBackup(zip)).toThrow(/tidak lengkap|tidak ditemukan/i);
  });

  it('menolak entri berisi bukan-JSON', () => {
    const zip = zipSync({
      'manifest.json': strToU8('{}'),
      'tasks-todo.json': strToU8('<<<bukan json>>>'),
      'tasks-doing.json': strToU8('{}'),
      'tasks-done.json': strToU8('{}'),
    });
    expect(() => unzipBackup(zip)).toThrow(/tasks-todo\.json/);
  });
});

describe('assertTask & validateBackup — tahap validasi', () => {
  it('menerima tugas lengkap dan menolak yang cacat', () => {
    expect(assertTask(mk('x', 'todo'), 'uji').id).toBe('x');
    expect(() => assertTask({ ...mk('x', 'todo'), title: '' }, 'uji')).toThrow(BackupError);
    expect(() => assertTask({ ...mk('x', 'todo'), status: 'gakada' }, 'uji')).toThrow(/status/);
    expect(() => assertTask({ ...mk('x', 'todo'), createdAt: 'bukan-tanggal' }, 'uji')).toThrow(/tanggal/);
    expect(() => assertTask('string', 'uji')).toThrow(BackupError);
  });

  it('menolak versi skema lain & items bukan array', () => {
    const zip = zipSync({
      'manifest.json': strToU8('{}'),
      'tasks-todo.json': strToU8(JSON.stringify({ version: 99, items: [] })),
      'tasks-doing.json': strToU8(JSON.stringify({ version: 1, items: [] })),
      'tasks-done.json': strToU8(JSON.stringify({ version: 1, items: [] })),
    });
    expect(() => validateBackup(unzipBackup(zip))).toThrow(/versi/);

    const zip2 = zipSync({
      'manifest.json': strToU8('{}'),
      'tasks-todo.json': strToU8(JSON.stringify({ version: 1, items: 'bukan-array' })),
      'tasks-doing.json': strToU8(JSON.stringify({ version: 1, items: [] })),
      'tasks-done.json': strToU8(JSON.stringify({ version: 1, items: [] })),
    });
    expect(() => validateBackup(unzipBackup(zip2))).toThrow(/items/);
  });

  it('menolak ID duplikat lintas store', () => {
    const zip = zipSync({
      'manifest.json': strToU8('{}'),
      'tasks-todo.json': strToU8(JSON.stringify(serializeStore([mk('d', 'todo')]))),
      'tasks-doing.json': strToU8(JSON.stringify(serializeStore([mk('d', 'doing')]))),
      'tasks-done.json': strToU8(JSON.stringify(serializeStore([]))),
    });
    expect(() => validateBackup(unzipBackup(zip))).toThrow(/duplikat/);
  });

  it('tugas dipetakan ke kolom sesuai nama file store', () => {
    const board = validateBackup(unzipBackup(validZip()));
    expect(board.todo.map((t) => t.id)).toEqual(['1']);
    expect(board.doing.map((t) => t.id)).toEqual(['2']);
    expect(board.done.map((t) => t.id)).toEqual(['3']);
  });

  it('roundtrip penuh: board → zip → unzip → validate → board identik', () => {
    const original = boardWith(mk('a', 'todo'), mk('b', 'doing'), mk('c', 'done'));
    const restored = validateBackup(unzipBackup(buildBackupZip(original)));
    expect(restored).toEqual(original);
    expect(buildManifest(original).counts).toEqual({ todo: 1, doing: 1, done: 1, total: 3 });
  });

  it('backup papan kosong tetap valid', () => {
    const restored = validateBackup(unzipBackup(validZip(emptyBoard2())));
    expect(restored.todo).toHaveLength(0);
    expect(restored.doing).toHaveLength(0);
    expect(restored.done).toHaveLength(0);
  });
});

function emptyBoard2(): Record<Status, Task[]> {
  return { todo: [], doing: [], done: [] };
}
