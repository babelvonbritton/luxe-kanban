/** Tahapan operasi (backup/restore) yang divisualkan di modal. */

export type StepId = 'verify' | 'validate' | 'load' | 'finish';
export type StepState = 'pending' | 'active' | 'done' | 'error';

export interface OperationStep {
  id: StepId;
  label: string;
  detail: string;
  state: StepState;
  note?: string;
}

export function createOperationSteps(mode: 'backup' | 'restore'): OperationStep[] {
  const noun = mode === 'backup' ? 'Backup' : 'Restore';
  return [
    {
      id: 'verify',
      label: 'Verifikasi arsip',
      detail:
        mode === 'backup'
          ? 'Menyiapkan arsip ZIP dari store granular.'
          : 'Memeriksa tanda tangan ZIP & kelengkapan entri.',
      state: 'pending',
    },
    {
      id: 'validate',
      label: 'Validasi data',
      detail: 'Memeriksa struktur & isi setiap store (versi skema, items, tugas).',
      state: 'pending',
    },
    {
      id: 'load',
      label: 'Memuat data baru',
      detail:
        mode === 'backup'
          ? 'Mengompres data menjadi arsip ZIP.'
          : 'Menulis data tervalidasi ke store granular LocalStorage.',
      state: 'pending',
    },
    {
      id: 'finish',
      label: `${noun} selesai`,
      detail: 'Merapikan status & menyiapkan antarmuka kembali.',
      state: 'pending',
    },
  ];
}

export function withStep(
  steps: OperationStep[],
  id: StepId,
  patch: Partial<Pick<OperationStep, 'state' | 'note' | 'detail'>>,
): OperationStep[] {
  return steps.map((step) => (step.id === id ? { ...step, ...patch } : step));
}
