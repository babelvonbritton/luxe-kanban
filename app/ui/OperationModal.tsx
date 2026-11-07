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
import { useLocale } from '@/lib/i18n';

interface Props {
  mode: 'backup' | 'restore';
  running: boolean;
  error: string | null;
  steps: OperationStep[];
  progress: number;
  onClose: () => void;
}

export function OperationModal({ mode, running, error, steps, progress, onClose }: Props) {
  const { t } = useLocale();
  const finished = !running; // selesai (sukses maupun error) → boleh ditutup
  return (
    <Modal
      title={mode === 'backup' ? t('backupSteps') : t('restoreSteps')}
      subtitle={
        running
          ? t('waitDontClose')
          : error
            ? t('operationError')
            : t('operationComplete')
      }
      closeable={finished}
      onClose={onClose}
      footer={
        <>
          {running ? (
            <span style={{ marginRight: 'auto', color: 'var(--text-faint)', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconSpinner size={14} /> {t('processingLocked')}
            </span>
          ) : (
            <span style={{ marginRight: 'auto' }} />
          )}
          <button className={`btn ${error ? 'danger' : 'primary'}`} onClick={onClose} disabled={running}>
            {error ? t('close') : t('complete')}
          </button>
        </>
      }
    >
      <StepsView mode={mode} steps={steps} progress={progress} error={error} />
    </Modal>
  );
}
