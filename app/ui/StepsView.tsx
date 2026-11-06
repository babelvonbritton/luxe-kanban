'use client';

/** Visualisasi tahapan operasi (verifikasi → validasi → muat → selesai). */
import { OperationStep } from '@/lib/steps';
import { IconAlert, IconCheck, IconSpinner } from './Icons';

interface Props {
  steps: OperationStep[];
  progress: number; // 0..100
  error: string | null;
}

const stateIcon = (state: OperationStep['state']) => {
  if (state === 'done') return <IconCheck size={14} />;
  if (state === 'active') return <IconSpinner size={14} />;
  if (state === 'error') return <IconAlert size={14} />;
  return <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', opacity: 0.5 }} />;
};

const STATE_LABEL: Record<OperationStep['state'], string> = {
  done: 'Selesai',
  active: 'Memproses…',
  error: 'Gagal',
  pending: 'Menunggu',
};

export function StepsView({ steps, progress, error }: Props) {
  return (
    <div>
      <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="steps">
        {steps.map((step) => (
          <div key={step.id} className={`step ${step.state}`} aria-current={step.state === 'active' ? 'step' : undefined}>
            <div className="step-dot">{stateIcon(step.state)}</div>
            <div>
              <div className="step-label">{step.label}</div>
              <div className="step-detail">{step.detail}</div>
              {step.note ? (
                <div className={`step-note ${step.state === 'error' ? 'err' : step.state === 'done' ? 'ok' : ''}`}>
                  {step.note}
                </div>
              ) : null}
            </div>
            <span className="step-status">{STATE_LABEL[step.state]}</span>
          </div>
        ))}
      </div>
      {error ? (
        <p className="confirm-text" style={{ color: 'var(--danger)', marginTop: 6 }} role="alert">
          <strong>Operasi dihentikan.</strong> {error}
        </p>
      ) : null}
    </div>
  );
}
