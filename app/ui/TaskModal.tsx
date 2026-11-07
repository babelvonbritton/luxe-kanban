'use client';

/** Modal buat/edit tugas dengan validasi judul + pemilih kolom/status. */
import { FormEvent, useState } from 'react';
import { Status, STATUS_META, Task } from '@/lib/types';
import { Modal } from './Modal';
import { useLocale } from '@/lib/i18n';

export interface TaskFormValues {
  title: string;
  description: string;
  status: Status;
}

interface Props {
  mode: 'create' | 'edit';
  task?: Task;
  defaultStatus: Status;
  saving: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onClose: () => void;
}

export function TaskModal({ mode, task, defaultStatus, saving, onSubmit, onClose }: Props) {
  const { t, statusLabel } = useLocale();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<Status>(task?.status ?? defaultStatus);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('requiredTitle'));
      return;
    }
    onSubmit({ title, description, status });
  };

  return (
    <Modal
      title={mode === 'create' ? t('createTask') : t('editTaskTitle')}
      subtitle={mode === 'create' ? t('addTaskSubtitle') : `ID: ${task?.id}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn subtle" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </button>
          <button className="btn primary" onClick={handleSubmit as unknown as () => void} disabled={saving}>
            {saving ? t('saving') : mode === 'create' ? t('add') : t('saveChanges')}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} id="task-form">
        <div className="field">
          <label htmlFor="task-title">{t('title')}</label>
          <input
            id="task-title"
            value={title}
            autoFocus
            placeholder={t('titlePlaceholder')}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
          />
          {error ? <span className="error">{error}</span> : null}
        </div>

        <div className="field">
          <label htmlFor="task-desc">{t('descriptionOptional')}</label>
          <textarea
            id="task-desc"
            value={description}
            placeholder={t('descriptionPlaceholder')}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="task-status">{mode === 'create' ? t('placeInColumn') : t('status')}</label>
          <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {(Object.keys(STATUS_META) as Status[]).map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
