'use client';

/** Kolom papan (Akan/Sedang/Sudah Dilakukan) + area drop drag & drop. */
import { CSSProperties, DragEvent } from 'react';
import { Status, STATUS_META, Task } from '@/lib/types';
import { IconCheckCircle, IconClipboard, IconHourglass, IconPlus } from './Icons';
import { TaskCard } from './TaskCard';

interface Props {
  status: Status;
  tasks: Task[];
  busyTaskId: string | null;
  isDropActive: boolean;
  onAddClick: () => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (task: Task, status: Status) => void;
  onDragStartTask: () => void;
  onDragEndTask: () => void;
  onDragOverColumn: (status: Status) => void;
  onDragLeaveColumn: (status: Status) => void;
  onDropInColumn: (status: Status, e: DragEvent) => void;
}

const COLUMN_ICONS = {
  todo: IconClipboard,
  doing: IconHourglass,
  done: IconCheckCircle,
} as const;

export function Column({
  status,
  tasks,
  busyTaskId,
  isDropActive,
  onAddClick,
  onOpenTask,
  onDeleteTask,
  onStatusChange,
  onDragStartTask,
  onDragEndTask,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropInColumn,
}: Props) {
  const meta = STATUS_META[status];
  const Icon = COLUMN_ICONS[status];

  return (
    <section
      className={`column${isDropActive ? ' is-drop' : ''}`}
      style={{ '--col-accent': meta.accent } as CSSProperties}
      aria-label={`${meta.label}: ${tasks.length} tugas`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOverColumn(status);
      }}
      onDragLeave={() => onDragLeaveColumn(status)}
      onDrop={(e) => onDropInColumn(status, e)}
    >
      <header className="column-head">
        <div className="column-title-wrap">
          <span className="column-icon">
            <Icon size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="column-title">{meta.label}</h2>
            <p className="column-hint">{meta.hint}</p>
          </div>
        </div>
        <span className="count-badge" aria-label={`${tasks.length} tugas`}>
          {tasks.length}
        </span>
      </header>

      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            accent={meta.accent}
            busy={busyTaskId === task.id}
            onOpen={() => onOpenTask(task)}
            onDelete={() => onDeleteTask(task)}
            onStatusChange={(s) => onStatusChange(task, s)}
            onDragStart={onDragStartTask}
            onDragEnd={onDragEndTask}
          />
        ))}
        {tasks.length === 0 ? <div className="drop-hint">Tarik kartu ke sini — kolom ini masih kosong.</div> : null}
      </div>

      <footer className="column-foot">
        <button className="btn subtle" onClick={onAddClick}>
          <IconPlus size={16} /> Tambah tugas
        </button>
      </footer>
    </section>
  );
}
