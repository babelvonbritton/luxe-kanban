'use client';

/**
 * Modal operasi (backup/restore) ber-tahapan.
 * Selama proses berjalan dialog TIDAK bisa ditutup & menutupi seluruh layar
 * (overlay penuh) sehingga user tidak bisa melakukan aksi lain.
 */
import { Modal } from './Modal';
import { StepsView } from './StepsView';
import { IconSpinner } from './Icons';
import { OperationStep } from '@/lib/steps';

interface Props {
  mode: 'backup' | 'restore';
  running: boolean;
  error: string | null;
  steps: OperationStep[];
  progress: number;
  onClose: () => void;
}

const noun = (m: 'backup' | 'restore') => (m === 'backup' ? 'Backup' : 'Restore');

export function OperationModal({ mode, running, error, steps, progress, onClose }: Props) {
  const finished = !running; // selesai (sukses maupun error) → boleh ditutup
  return (
    <Modal
      title={`${noun(mode)} Data`}
      subtitle={
        running
          ? 'Mohon tunggu — jangan tutup halaman ini.'
          : error
            ? 'Proses berakhir dengan kesalahan.'
            : 'Proses selesai.'
      }
      closeable={finished}
      onClose={onClose}
      footer={
        <>
          {running ? (
            <span style={{ marginRight: 'auto', color: 'var(--text-faint)', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconSpinner size={14} /> Memproses… UI terkunci hingga selesai
            </span>
          ) : (
            <span style={{ marginRight: 'auto' }} />
          )}
          <button className={`btn ${error ? 'danger' : 'primary'}`} onClick={onClose} disabled={running}>
            {error ? 'Tutup' : 'Selesai'}
          </button>
        </>
      }
    >
      <StepsView steps={steps} progress={progress} error={error} />
    </Modal>
  );
}
