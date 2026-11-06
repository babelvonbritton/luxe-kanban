'use client';

/**
 * Hook untuk operasi ber-tahapan (backup/restore).
 * Mengunci seluruh UI (overlay) selama operasi berjalan,
 * menjalankan tahapan dengan jeda visual agar terlihat berurutan,
 * dan melaporkan hasil/error per tahap.
 */
import { useCallback, useRef, useState } from 'react';
import { createOperationSteps, OperationStep, StepId, withStep } from '@/lib/steps';

export interface StepEvent {
  id: StepId;
  note?: string;
  error?: string;
}

export interface UseApiOperation {
  active: boolean;
  finished: boolean;
  mode: 'backup' | 'restore' | null;
  steps: OperationStep[];
  error: string | null;
  progress: number;
  run: (mode: 'backup' | 'restore', job: (report: (e: StepEvent) => void) => Promise<string>) => Promise<void>;
  close: () => void;
}

const PACE = 520; // jeda antar-tahap (ms) agar proses terlihat

export function useApiOperation(): UseApiOperation {
  const [mode, setMode] = useState<'backup' | 'restore' | null>(null);
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const runningRef = useRef(false);

  const run = useCallback(
    async (m: 'backup' | 'restore', job: (report: (e: StepEvent) => void) => Promise<string>) => {
      if (runningRef.current) return;
      runningRef.current = true;

      const initial = createOperationSteps(m);
      setMode(m);
      setSteps(initial);
      setError(null);
      setFinished(false);
      setProgress(6);

      const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

      const report = (e: StepEvent) => {
        if (e.error) {
          setSteps((s) => withStep(s, e.id, { state: 'error', note: e.error }));
          setProgress(e.id === 'verify' ? 10 : e.id === 'validate' ? 40 : 70);
        } else {
          setSteps((s) => withStep(s, e.id, { state: 'done', note: e.note }));
          setProgress(e.id === 'verify' ? 35 : e.id === 'validate' ? 65 : e.id === 'load' ? 90 : 100);
        }
      };

      try {
        // Tahap 1: verifikasi
        setSteps((s) => withStep(s, 'verify', { state: 'active' }));
        await wait(PACE);
        const summary = await job(report);
        // job memanggil report per tahap; beri ritme visual antar tahap
        await wait(PACE);
        setSteps((s) => withStep(s, 'finish', { state: 'done', note: summary }));
        setProgress(100);
        setFinished(true);
        await wait(420);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
        // Tandai tahap "finish" gagal + tampilkan pesan
        setSteps((s) => s.map((st) => (st.state === 'active' ? { ...st, state: 'error' } : st)));
        setSteps((s) => withStep(s, 'finish', { state: 'error', note: 'Operasi tidak diselesaikan.' }));
        setError(message);
        setProgress(100);
        setFinished(true); // selesai (gagal) → modal boleh ditutup
      } finally {
        runningRef.current = false;
      }
    },
    [],
  );

  const close = useCallback(() => {
    setMode(null);
    setSteps([]);
    setError(null);
    setProgress(0);
    setFinished(false);
  }, []);

  return { active: mode !== null, finished, mode, steps, error, progress, run, close };
}
