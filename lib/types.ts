/** Tipe & konstanta inti Luxe Kanban. */

export type Status = 'todo' | 'doing' | 'done';

export const STATUSES: readonly Status[] = ['todo', 'doing', 'done'] as const;

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export type BoardState = Record<Status, Task[]>;

export interface StatusMeta {
  label: string;
  hint: string;
  accent: string;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  todo: {
    label: 'Akan Dilakukan',
    hint: 'Antrean tugas yang menunggu untuk dimulai',
    accent: 'var(--accent)',
  },
  doing: {
    label: 'Sedang Dilakukan',
    hint: 'Tugas yang sedang dikerjakan saat ini',
    accent: '#d9a756',
  },
  done: {
    label: 'Sudah Dilakukan',
    hint: 'Tugas yang telah rampung',
    accent: '#67b99a',
  },
};

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}
