'use client';

/** Visualisasi tahapan operasi (verifikasi → validasi → muat → selesai). */
import { OperationStep } from '@/lib/steps';
import { IconAlert, IconCheck, IconSpinner } from './Icons';
import { useLocale } from '@/lib/i18n';

interface Props {
  mode: 'backup' | 'restore';
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

export function StepsView({ mode, steps, progress, error }: Props) {
  const { t, locale } = useLocale();
  const stateLabel = (state: OperationStep['state']) => {
    if (state === 'done') return t('stepDone');
    if (state === 'active') return t('stepActive');
    if (state === 'error') return t('stepError');
    return t('stepPending');
  };
  const stepCopy = (step: OperationStep) => {
    if (step.id === 'verify') {
      return {
        label: t('stepVerify'),
        detail: locale === 'en-US' ? mode === 'backup' ? t('backupVerifyDetail') : t('restoreVerifyDetail') : step.detail,
      };
    }
    if (step.id === 'validate') return { label: t('stepValidate'), detail: locale === 'en-US' ? t('validateDetail') : step.detail };
    if (step.id === 'load') {
      return { label: t('stepLoad'), detail: locale === 'en-US'
        ? step.detail.includes('ZIP')
          ? t('backupLoadDetail')
          : t('restoreLoadDetail')
        : step.detail };
    }
    return {
      label: locale === 'en-US' ? mode === 'backup' ? t('archiveReady') : t('restoreReady') : step.label,
      detail: locale === 'en-US' ? t('finishDetail') : step.detail,
    };
  };
  return (
    <div>
      <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="steps">
        {steps.map((step) => (
          (() => {
            const copy = stepCopy(step);
            return (
          <div key={step.id} className={`step ${step.state}`} aria-current={step.state === 'active' ? 'step' : undefined}>
            <div className="step-dot">{stateIcon(step.state)}</div>
            <div>
              <div className="step-label">{copy.label}</div>
              <div className="step-detail">{copy.detail}</div>
              {step.note ? (
                <div className={`step-note ${step.state === 'error' ? 'err' : step.state === 'done' ? 'ok' : ''}`}>
                  {step.note}
                </div>
              ) : null}
            </div>
            <span className="step-status">{stateLabel(step.state)}</span>
          </div>
            );
          })()
        ))}
      </div>
      {error ? (
        <p className="confirm-text" style={{ color: 'var(--danger)', marginTop: 6 }} role="alert">
          <strong>{t('operationStopped')}</strong> {error}
        </p>
      ) : null}
    </div>
  );
}
