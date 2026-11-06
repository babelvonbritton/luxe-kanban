/** Util kecil tanpa dependensi. */

export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function generateId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') {
    return `tsk_${c.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `tsk_${Date.now().toString(36)}${rand}`;
}

export function clampIndex(value: number, length: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.trunc(value), length));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return 'Belum pernah';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Belum pernah';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
