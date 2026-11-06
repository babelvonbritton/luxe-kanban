'use client';

/** Kerangka halaman: topbar (brand + aksi global) dan container children. */
import { ReactNode } from 'react';
import { IconArchive, IconDownload, IconReset, IconUpload } from './Icons';

interface Props {
  totalTasks: number;
  lastBackupLabel: string;
  busy: boolean;
  onBackup: () => void;
  onRestoreClick: () => void;
  onResetClick: () => void;
  children: ReactNode;
}

export function AppShell({ totalTasks, lastBackupLabel, busy, onBackup, onRestoreClick, onResetClick, children }: Props) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <IconArchive size={22} />
          </div>
          <div>
            <h1 className="brand-title">
              Luxe <em>Kanban</em>
            </h1>
            <p className="brand-sub">
              Premium Task Board · {totalTasks} tugas
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <span
            title={`Backup terakhir: ${lastBackupLabel}`}
            style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.04em' }}
          >
            Backup terakhir: {lastBackupLabel}
          </span>
          <button className="btn" onClick={onRestoreClick} disabled={busy}>
            <IconUpload size={16} /> Restore
          </button>
          <button className="btn primary" onClick={onBackup} disabled={busy}>
            <IconDownload size={16} /> Backup ZIP
          </button>
          <button className="btn" onClick={onResetClick} disabled={busy} title="Kosongkan seluruh papan">
            <IconReset size={16} /> Reset
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
