'use client';

/** Kerangka halaman: topbar (brand + aksi global) dan container children. */
import { ReactNode } from 'react';
import { IconArchive, IconDownload, IconReset, IconUpload } from './Icons';
import { useLocale } from '@/lib/i18n';

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
  const { locale, setLocale, t } = useLocale();
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
              {t('premiumBoard')} · {totalTasks} {t('tasks')}
            </p>
          </div>
        </div>

        <div className="topbar-actions">
          <span
            title={t('lastBackup', { date: lastBackupLabel })}
            style={{ fontSize: 12, color: 'var(--text-faint)', letterSpacing: '0.04em' }}
          >
            {t('lastBackup', { date: lastBackupLabel })}
          </span>
          <label className="language-select">
            <span className="sr-only">{t('language')}</span>
            <select
              value={locale}
              aria-label={t('language')}
              onChange={(event) => setLocale(event.target.value as 'id' | 'en-US')}
            >
              <option value="id">{t('indonesian')}</option>
              <option value="en-US">{t('english')}</option>
            </select>
          </label>
          <button className="btn" onClick={onRestoreClick} disabled={busy}>
            <IconUpload size={16} /> {t('restore')}
          </button>
          <button className="btn primary" onClick={onBackup} disabled={busy}>
            <IconDownload size={16} /> {t('backupZip')}
          </button>
          <button className="btn" onClick={onResetClick} disabled={busy} title={t('resetBoard')}>
            <IconReset size={16} /> {t('reset')}
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
