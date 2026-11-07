'use client';

/** Satu kartu tugas: klik = edit, ikon = aksi, tombol = ganti status, draggable. */
import { useEffect, useRef, useState } from 'react';
import { CSSProperties, DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { Status, STATUS_META, Task } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import { IconEdit, IconGrip, IconTrash } from './Icons';
import { useLocale, localeTag } from '@/lib/i18n';

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
  const [statusMenu, setStatusMenu] = useState<{ top: number; left: number } | null>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const { t, statusLabel, locale } = useLocale();

  const closeStatusMenu = () => setStatusMenu(null);

  useEffect(() => {
    if (!statusMenu) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        !statusMenuRef.current?.contains(event.target as Node) &&
        !statusButtonRef.current?.contains(event.target as Node)
      ) closeStatusMenu();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeStatusMenu();
        statusButtonRef.current?.focus();
      }
    };
    const closeOnViewportChange = () => closeStatusMenu();
    window.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      window.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [statusMenu]);

  const toggleStatusMenu = () => {
    if (statusMenu) {
      closeStatusMenu();
      return;
    }
    const bounds = statusButtonRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const menuHeight = 126;
    const top = bounds.bottom + menuHeight < window.innerHeight
      ? bounds.bottom + 6
      : Math.max(8, bounds.top - menuHeight - 6);
    const left = Math.min(bounds.left, window.innerWidth - 196);
    setStatusMenu({ top, left: Math.max(8, left) });
  };

  return (
    <article
      className={`task-card${dragging ? ' is-dragging' : ''}`}
      style={{ '--col-accent': accent } as CSSProperties}
      data-task-id={task.id}
      draggable
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest('.status-switcher')) {
          e.preventDefault();
          return;
        }
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
        <span style={{ color: 'var(--text-faint)', flex: 'none' }} title={t('dragToMove')}>
          <IconGrip size={16} />
        </span>
      </div>

      {task.description ? <p className="task-desc">{task.description}</p> : null}

      <div className="task-foot">
        <div className={`status-switcher${busy ? ' is-busy' : ''}`}>
          <button
            ref={statusButtonRef}
            className="status-trigger"
            type="button"
            aria-label={t('changeStatus', { title: task.title })}
            aria-expanded={Boolean(statusMenu)}
            aria-haspopup="true"
            disabled={busy}
            onClick={toggleStatusMenu}
          >
            {t('changeStatusShort')}
          </button>
          {statusMenu && typeof document !== 'undefined'
            ? createPortal(
              <div
                ref={statusMenuRef}
                className="status-options"
                role="group"
                aria-label={t('chooseStatus')}
                style={{ top: statusMenu.top, left: statusMenu.left }}
              >
                {(Object.keys(STATUS_META) as Status[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="status-option"
                    disabled={busy || status === task.status}
                    aria-current={status === task.status ? 'true' : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeStatusMenu();
                      onStatusChange(status);
                    }}
                  >
                    {statusLabel(status)}
                    {status === task.status ? ` · ${t('current')}` : ''}
                  </button>
                ))}
              </div>,
              document.body,
            )
            : null}
        </div>

        <div className="card-actions">
          <button className="icon-btn" onClick={onOpen} aria-label={t('editTask', { title: task.title })} title={t('editTaskTitle')}>
            <IconEdit size={16} />
          </button>
          <button className="icon-btn danger" onClick={onDelete} aria-label={t('deleteTask', { title: task.title })} title={t('delete')}>
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="task-date">{t('updated', { date: formatDateShort(task.updatedAt, localeTag(locale)) })}</div>
    </article>
  );
}
