import { describe, expect, it } from 'vitest';
import {
  EMPTY_META,
  loadStatusTasks,
  migrateIfNeeded,
  parseStore,
  readAllTasks,
  readMeta,
  readLegacyTasks,
  StorageError,
  storageKeys,
  StoreFile,
  writeAllTasks,
  writeMeta,
} from '@/lib/storage';
import { Status, Task } from '@/lib/types';
import { countBoard, createSeedBoard } from '@/lib/storage';

class MemStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.get(key) ?? null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
  dump() { return Object.fromEntries(this.map.entries()); }
}

function mk(id: string, status: Status): Task {
  return { id, title: `T ${id}`, description: '', status, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
}

describe('parseStore', () => {
  it('menolak JSON rusak, bentuk salah, dan versi lain', () => {
    expect(() => parseStore('<<<', 'uji')).toThrow(StorageError);
    expect(() => parseStore('[]', 'uji')).toThrow(StorageError);
    expect(() => parseStore(JSON.stringify({ version: 2, items: [] }), 'uji')).toThrow(/versi/);
    expect(() => parseStore(JSON.stringify({ version: 1, items: 'bukan' }), 'uji')).toThrow(/items/);
  });
});

describe('loadStatusTasks', () => {
  it('null → kosong; item rusak di-skip; store valid dimuat', () => {
    const s = new MemStorage();
    expect(loadStatusTasks(s, 'todo')).toEqual([]);

    s.setItem(storageKeys.tasks('todo'), JSON.stringify({
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      items: [mk('a', 'todo'), { id: 'rusak' }, 'bukan-objek'],
    }));
    expect(loadStatusTasks(s, 'todo').map((t) => t.id)).toEqual(['a']);

    s.setItem(storageKeys.tasks('doing'), '<<<rusak>>>');
    expect(loadStatusTasks(s, 'doing')).toEqual([]); // gagal lembut
  });
});

describe('readAllTasks / writeAllTasks — granular', () => {
  it('menulis per-status dan terbaca kembali persis', () => {
    const s = new MemStorage();
    const board: Record<Status, Task[]> = { todo: [mk('a', 'todo')], doing: [mk('b', 'doing')], done: [] };
    writeAllTasks(s, board);
    expect(Object.keys(s.dump()).sort()).toEqual([
      'luxekanban.v1.tasks.doing',
      'luxekanban.v1.tasks.done',
      'luxekanban.v1.tasks.todo',
    ]);
    expect(readAllTasks(s)).toEqual(board);
    expect(countBoard(readAllTasks(s))).toBe(2);
  });

  it('migrasi dari key legacy lama + dedupe', () => {
    const s = new MemStorage();
    s.setItem(storageKeys.legacyTasks, JSON.stringify({
      version: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
      items: [mk('a', 'todo'), { id: 'rusak' }],
    }));
    const migrated = migrateIfNeeded(s);
    expect(migrated.migrated).toBe(true);
    expect(migrated.taskCount).toBe(1);
    expect(readLegacyTasks(s)).toBeNull(); // dibersihkan
    expect(readAllTasks(s).todo.map((t) => t.id)).toEqual(['a']);
  });
});

describe('migrateIfNeeded', () => {
  it('storage kosong → seed contoh', () => {
    const s = new MemStorage();
    const r = migrateIfNeeded(s);
    expect(r.seeded).toBe(true);
    expect(countBoard(readAllTasks(s))).toBe(r.taskCount);
    expect(createSeedBoard().todo.length + createSeedBoard().doing.length + createSeedBoard().done.length).toBe(6);
  });

  it('sudah granular → tidak melakukan apa-apa', () => {
    const s = new MemStorage();
    writeAllTasks(s, { todo: [mk('a', 'todo')], doing: [], done: [] });
    const r = migrateIfNeeded(s);
    expect(r.seeded).toBe(false);
    expect(r.migrated).toBe(false);
    expect(r.taskCount).toBe(1);
  });
});

describe('meta', () => {
  it('default, simpan, dan pulih dari rusak', () => {
    const s = new MemStorage();
    expect(readMeta(s)).toEqual(EMPTY_META);
    writeMeta(s, { lastBackupAt: '2026-06-06T00:00:00.000Z', lastRestoreAt: null, restoredTaskCount: 7 });
    expect(readMeta(s).restoredTaskCount).toBe(7);
    s.setItem(storageKeys.meta, '<<<');
    expect(readMeta(s)).toEqual(EMPTY_META);
  });

  it('StoreFile tipe serializable untuk ZIP', () => {
    const store: StoreFile<Task> = { version: 1, updatedAt: 'x', items: [] };
    expect(JSON.parse(JSON.stringify(store))).toEqual(store);
  });
});
