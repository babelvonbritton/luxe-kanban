import { describe, expect, it } from 'vitest';
import {
  addTask,
  createTask,
  deleteTask,
  findTask,
  moveTask,
  updateTask,
  ValidationError,
  countTasks,
  emptyBoard,
} from '@/lib/board';
import { Status, Task } from '@/lib/types';

function mk(id: string, title: string, status: Status): Task {
  return { id, title, description: '', status, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
}

function boardWith(...tasks: Task[]) {
  const board = emptyBoard<Task>();
  for (const t of tasks) board[t.status].push(t);
  return board;
}

describe('createTask', () => {
  it('menolak judul kosong/whitespace', () => {
    expect(() => createTask({ title: '   ', description: '' }, 'todo')).toThrow(ValidationError);
    expect(() => createTask({ title: '', description: '' }, 'todo')).toThrow(ValidationError);
  });

  it('membuat tugas dengan judul & deskripsi ter-trim', () => {
    const task = createTask({ title: '  Belanja  ', description: ' kopi ' }, 'doing');
    expect(task.title).toBe('Belanja');
    expect(task.description).toBe('kopi');
    expect(task.status).toBe('doing');
    expect(task.id).toMatch(/^tsk_/);
    expect(new Date(task.createdAt).toString()).not.toBe('Invalid Date');
    expect(task.createdAt).toBe(task.updatedAt);
  });
});

describe('addTask', () => {
  it('menambahkan di paling atas kolom tanpa mengubah board asli', () => {
    const board = boardWith(mk('a', 'A', 'todo'));
    const next = addTask(board, { title: 'B', description: '' }, 'todo');
    expect(next.todo).toHaveLength(2);
    expect(next.todo[0].id).toMatch(/^tsk_/); // tugas baru di paling atas
    expect(next.todo[1].id).toBe('a');
    expect(board.todo).toHaveLength(1); // immutable
  });
});

describe('updateTask', () => {
  it('mengubah judul + updatedAt, id & createdAt tetap', () => {
    const board = boardWith(mk('a', 'A', 'todo'));
    const next = updateTask(board, 'a', { title: 'A2' }, new Date('2026-02-02T00:00:00Z'));
    expect(next.todo[0].title).toBe('A2');
    expect(next.todo[0].updatedAt).toBe('2026-02-02T00:00:00.000Z');
    expect(next.todo[0].id).toBe('a');
  });

  it('menolak judul kosong dan id tak dikenal', () => {
    const board = boardWith(mk('a', 'A', 'todo'));
    expect(() => updateTask(board, 'a', { title: ' ' })).toThrow(ValidationError);
    expect(() => updateTask(board, 'nope', { title: 'X' })).toThrow(ValidationError);
  });
});

describe('deleteTask', () => {
  it('menghapus tugas dan id tak dikenal adalah no-op', () => {
    const board = boardWith(mk('a', 'A', 'todo'), mk('b', 'B', 'done'));
    expect(deleteTask(board, 'a').todo).toHaveLength(0);
    expect(deleteTask(board, 'zzz')).toBe(board);
  });
});

describe('moveTask', () => {
  it('lintas kolom: keluar dari sumber, masuk target, status berubah', () => {
    const board = boardWith(mk('a', 'A', 'todo'), mk('b', 'B', 'doing'));
    const next = moveTask(board, 'a', 'doing', null, new Date('2026-03-03T00:00:00Z'));
    expect(next.todo).toHaveLength(0);
    expect(next.doing.map((t) => t.id)).toEqual(['a', 'b']);
    expect(next.doing[0].status).toBe('doing');
    expect(next.doing[0].updatedAt).toBe('2026-03-03T00:00:00.000Z');
  });

  it('indeks target di-clamp (negatif → atas, lebih panjang → akhir)', () => {
    const board = boardWith(mk('a', 'A', 'todo'), mk('b', 'B', 'todo'));
    const next = moveTask(board, 'a', 'todo', 99);
    expect(next.todo.map((t) => t.id)).toEqual(['b', 'a']);
    const next2 = moveTask(next, 'b', 'todo', -5);
    expect(next2.todo.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('urutan ulang di kolom sama tidak mengubah updatedAt', () => {
    const board = boardWith(mk('a', 'A', 'todo'), mk('b', 'B', 'todo'));
    const next = moveTask(board, 'b', 'todo', 0, new Date('2026-04-04T00:00:00Z'));
    expect(next.todo[0].id).toBe('b');
    expect(next.todo[1].updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('id tak dikenal → no-op', () => {
    const board = boardWith(mk('a', 'A', 'todo'));
    expect(moveTask(board, 'nope', 'done', 0)).toBe(board);
  });
});

describe('findTask & countTasks', () => {
  it('menemukan tugas lintas kolom dan menghitung total', () => {
    const board = boardWith(mk('a', 'A', 'todo'), mk('b', 'B', 'done'));
    expect(findTask(board, 'b')?.status).toBe('done');
    expect(findTask(board, 'zzz')).toBeNull();
    expect(countTasks(board)).toBe(2);
    expect(countTasks(emptyBoard())).toBe(0);
  });
});
