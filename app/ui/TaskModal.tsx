'use client';

/** Modal buat/edit tugas dengan validasi judul + pemilih kolom/status. */
import { FormEvent, useState } from 'react';
import { Status, STATUS_META, Task } from '@/lib/types';
import { Modal } from './Modal';

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
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<Status>(task?.status ?? defaultStatus);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul tugas wajib diisi.');
      return;
    }
    onSubmit({ title, description, status });
  };

  return (
    <Modal
      title={mode === 'create' ? 'Tugas Baru' : 'Edit Tugas'}
      subtitle={mode === 'create' ? 'Tambahkan tugas ke papan Anda.' : `ID: ${task?.id}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn subtle" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button className="btn primary" onClick={handleSubmit as unknown as () => void} disabled={saving}>
            {saving ? 'Menyimpan…' : mode === 'create' ? 'Tambahkan' : 'Simpan Perubahan'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} id="task-form">
        <div className="field">
          <label htmlFor="task-title">Judul</label>
          <input
            id="task-title"
            value={title}
            autoFocus
            placeholder="cth. Finalisasi proposal klien"
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
          />
          {error ? <span className="error">{error}</span> : null}
        </div>

        <div className="field">
          <label htmlFor="task-desc">Deskripsi (opsional)</label>
          <textarea
            id="task-desc"
            value={description}
            placeholder="Tambahkan detail, tautan, atau catatan…"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="task-status">{mode === 'create' ? 'Tempatkan di kolom' : 'Status'}</label>
          <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {(Object.keys(STATUS_META) as Status[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
