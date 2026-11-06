/** Operasi papan: immutable, murni, mudah diuji. */
import { Status, Task } from './types';
import { generateId, nowIso, clampIndex } from './utils';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface TaskInput {
  title: string;
  description: string;
}

export function emptyBoard<T>(): Record<Status, T[]> {
  return { todo: [], doing: [], done: [] };
}

export function createTask(input: TaskInput, status: Status, now: Date = new Date()): Task {
  const title = (input.title ?? '').trim();
  if (!title) throw new ValidationError('Judul tugas wajib diisi.');
  return {
    id: generateId(),
    title,
    description: (input.description ?? '').trim(),
    status,
    createdAt: nowIso(now),
    updatedAt: nowIso(now),
  };
}

export function findTask(
  board: Record<Status, Task[]>,
  id: string,
): { status: Status; index: number; task: Task } | null {
  for (const status of Object.keys(board) as Status[]) {
    const index = board[status].findIndex((t) => t.id === id);
    if (index >= 0) return { status, index, task: board[status][index] };
  }
  return null;
}

export function addTask(
  board: Record<Status, Task[]>,
  input: TaskInput,
  status: Status,
  now: Date = new Date(),
): Record<Status, Task[]> {
  const task = createTask(input, status, now);
  return { ...board, [status]: [task, ...board[status]] };
}

export function updateTask(
  board: Record<Status, Task[]>,
  id: string,
  patch: Partial<TaskInput>,
  now: Date = new Date(),
): Record<Status, Task[]> {
  const found = findTask(board, id);
  if (!found) throw new ValidationError(`Tugas dengan id "${id}" tidak ditemukan.`);
  if (patch.title !== undefined) {
    const title = (patch.title ?? '').trim();
    if (!title) throw new ValidationError('Judul tugas wajib diisi.');
  }
  const updated: Task = {
    ...found.task,
    ...(patch.title !== undefined ? { title: (patch.title ?? '').trim() } : {}),
    ...(patch.description !== undefined ? { description: (patch.description ?? '').trim() } : {}),
    updatedAt: nowIso(now),
  };
  const next = [...board[found.status]];
  next[found.index] = updated;
  return { ...board, [found.status]: next };
}

export function deleteTask(board: Record<Status, Task[]>, id: string): Record<Status, Task[]> {
  const found = findTask(board, id);
  if (!found) return board;
  return {
    ...board,
    [found.status]: board[found.status].filter((t) => t.id !== id),
  };
}

/**
 * Pindahkan tugas ke kolom lain (atau urutkan ulang di kolom yang sama).
 * targetIndex null berarti taruh paling atas; indeks di-clamp.
 */
export function moveTask(
  board: Record<Status, Task[]>,
  id: string,
  targetStatus: Status,
  targetIndex: number | null,
  now: Date = new Date(),
): Record<Status, Task[]> {
  const found = findTask(board, id);
  if (!found) return board;

  const source = [...board[found.status]];
  const [task] = source.splice(found.index, 1);

  const statusChanged = found.status !== targetStatus;
  const moved: Task = statusChanged ? { ...task, status: targetStatus, updatedAt: nowIso(now) } : task;

  const target = statusChanged ? [...board[targetStatus]] : source;
  const index = targetIndex === null ? 0 : clampIndex(targetIndex, target.length);
  target.splice(index, 0, moved);

  const nextBoard: Record<Status, Task[]> = { ...board };
  if (statusChanged) {
    nextBoard[found.status] = source;
    nextBoard[targetStatus] = target;
  } else {
    nextBoard[found.status] = target;
  }
  return nextBoard;
}

export function countTasks(board: Record<Status, Task[]>): number {
  return Object.values(board).reduce((sum, list) => sum + list.length, 0);
}
