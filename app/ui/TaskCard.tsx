'use client';

/** Satu kartu tugas: klik = edit, ikon = aksi, tombol = ganti status, draggable. */
import { useState } from 'react';
import { CSSProperties, DragEvent } from 'react';
import { Status, STATUS_META, Task } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import { IconEdit, IconGrip, IconTrash } from './Icons';

interface Props {
  task: Task;
  accent: string;
  busy: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onStatusChange: (status: Status) => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}

export function TaskCard({ task, accent, busy, onOpen, onDelete, onStatusChange, onDragStart, onDragEnd }: Props) {
  const [dragging, setDragging] = useState(false);

  return (
    <article
      className={`task-card${dragging ? ' is-dragging' : ''}`}
      style={{ '--col-accent': accent } as CSSProperties}
      data-task-id={task.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
        onDragStart(e);
      }}
      onDragEnd={(e) => {
        setDragging(false);
        onDragEnd(e);
      }}
    >
      <div className="task-card-top">
        <h3 className="task-title">{task.title}</h3>
        <span style={{ color: 'var(--text-faint)', flex: 'none' }} title="Tarik untuk memindahkan">
          <IconGrip size={16} />
        </span>
      </div>

      {task.description ? <p className="task-desc">{task.description}</p> : null}

      <div className="task-foot">
        <details className={`status-switcher${busy ? ' is-busy' : ''}`}>
          <summary aria-label={`Ganti status tugas: ${task.title}`} aria-disabled={busy}>
            Ganti status
          </summary>
          <div className="status-options" role="group" aria-label="Pilih status baru">
            {(Object.keys(STATUS_META) as Status[]).map((status) => (
              <button
                key={status}
                type="button"
                className="status-option"
                disabled={busy || status === task.status}
                aria-current={status === task.status ? 'true' : undefined}
                onClick={(event) => {
                  event.currentTarget.closest('details')?.removeAttribute('open');
                  onStatusChange(status);
                }}
              >
                {STATUS_META[status].label}
                {status === task.status ? ' · saat ini' : ''}
              </button>
            ))}
          </div>
        </details>

        <div className="card-actions">
          <button className="icon-btn" onClick={onOpen} aria-label={`Edit tugas: ${task.title}`} title="Edit">
            <IconEdit size={16} />
          </button>
          <button className="icon-btn danger" onClick={onDelete} aria-label={`Hapus tugas: ${task.title}`} title="Hapus">
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="task-date">Diperbarui {formatDateShort(task.updatedAt)}</div>
    </article>
  );
}
