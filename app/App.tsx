'use client';

/**
 * Luxe Kanban — shell aplikasi.
 * State papan + CRUD + drag & drop + backup/restore ber-tahapan.
 */
import { useCallback, useEffect, useRef, useState, DragEvent } from 'react';
import {
  addTask,
  countTasks,
  deleteTask,
  moveTask,
  TaskInput,
  updateTask,
} from '@/lib/board';
import { migrateIfNeeded, readAllTasks, readMeta, writeAllTasks } from '@/lib/storage';
import { isStatus, STATUSES, Status, STATUS_META, Task } from '@/lib/types';
import { formatBytes, formatTimestamp } from '@/lib/utils';
import { performBackup, performRestore } from '@/lib/backupService';
import { AppShell } from '@/app/ui/AppShell';
import { Column } from '@/app/ui/Column';
import { ConfirmModal } from '@/app/ui/ConfirmModal';
import { OperationModal } from '@/app/ui/OperationModal';
import { TaskModal, TaskFormValues } from '@/app/ui/TaskModal';
import { useApiOperation } from '@/app/ui/useApiOperation';
import { IconAlert, IconArchive } from '@/app/ui/Icons';

type ModalState =
  | { kind: 'none' }
  | { kind: 'task-create'; status: Status }
  | { kind: 'task-edit'; task: Task }
  | { kind: 'delete-task'; task: Task }
  | { kind: 'reset' }
  | { kind: 'restore-confirm'; bytes: Uint8Array; fileName: string };

const PAGE_LOCK = 'lkOpsRunning';

export function App() {
  const [ready, setReady] = useState(false);
  const [board, setBoard] = useState<Record<Status, Task[]>>({ todo: [], doing: [], done: [] });
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [saving, setSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState(false);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [restoreInfo, setRestoreInfo] = useState<string | null>(null);
  const op = useApiOperation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDownload = useRef<{ fileName: string; bytes: Uint8Array } | null>(null);

  const showToast = useCallback((kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  /* ---------- bootstrap: migrasi/seed lalu baca board ---------- */
  useEffect(() => {
    try {
      migrateIfNeeded(window.localStorage);
      setBoard(readAllTasks(window.localStorage));
      setLastBackupAt(readMeta(window.localStorage).lastBackupAt);
      setReady(true);
    } catch (error) {
      showToast('err', error instanceof Error ? error.message : 'LocalStorage tidak dapat diakses.');
      setReady(true);
    }
  }, [showToast]);

  /* ---------- persist setiap perubahan board ---------- */
  const commit = useCallback(
    (next: Record<Status, Task[]>) => {
      setBoard(next);
      try {
        writeAllTasks(window.localStorage, next);
      } catch (error) {
        showToast('err', error instanceof Error ? error.message : 'Gagal menyimpan ke LocalStorage.');
      }
    },
    [showToast],
  );

  /* ---------- CRUD ---------- */
  const handleCreate = useCallback(
    (status: Status, values: TaskFormValues) => {
      setSaving(true);
      try {
        commit(addTask(board, { title: values.title, description: values.description }, values.status));
        setModal({ kind: 'none' });
        showToast('ok', 'Tugas baru ditambahkan.');
      } catch (error) {
        showToast('err', error instanceof Error ? error.message : 'Gagal menambahkan tugas.');
      } finally {
        setSaving(false);
      }
    },
    [board, commit, showToast],
  );

  const handleUpdate = useCallback(
    (id: string, values: TaskFormValues) => {
      setSaving(true);
      try {
        // Ubah isi + pindahkan kolom bila status diganti dari modal.
        let next = updateTask(board, id, { title: values.title, description: values.description });
        const current = Object.values(next)
          .flat()
          .find((t) => t.id === id);
        if (current && current.status !== values.status) {
          next = moveTask(next, id, values.status, 0);
        }
        commit(next);
        setModal({ kind: 'none' });
        showToast('ok', 'Perubahan disimpan.');
      } catch (error) {
        showToast('err', error instanceof Error ? error.message : 'Gagal menyimpan perubahan.');
      } finally {
        setSaving(false);
      }
    },
    [board, commit, showToast],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      commit(deleteTask(board, task.id));
      setModal({ kind: 'none' });
      showToast('ok', 'Tugas dihapus.');
    },
    [board, commit, showToast],
  );

  const handleStatusChange = useCallback(
    (task: Task, status: Status) => {
      if (status === task.status) return;
      setBusyTaskId(task.id);
      // jeda mikro agar transisi select terasa & state render stabil
      setTimeout(() => {
        try {
          commit(moveTask(board, task.id, status, 0));
        } finally {
          setBusyTaskId(null);
        }
      }, 120);
    },
    [board, commit],
  );

  /* ---------- drag & drop ---------- */
  const handleDrop = useCallback(
    (status: Status, e: DragEvent) => {
      e.preventDefault();
      setDropTarget(null);
      setDraggingTask(false);
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;
      const cards = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-task-id]'));
      let index: number | null;
      if (cards.length === 0) {
        index = null; // kolom kosong → paling atas
      } else {
        index = cards.length; // default: paling bawah (append)
        for (let i = 0; i < cards.length; i++) {
          const cr = cards[i].getBoundingClientRect();
          if (e.clientY < cr.top + cr.height / 2) {
            index = i;
            break;
          }
        }
      }
      setBoard((prev) => {
        const next = moveTask(prev, id, status, index);
        writeAllTasks(window.localStorage, next);
        return next;
      });
    },
    [],
  );

  /* ---------- BACKUP ---------- */
  const handleBackup = useCallback(async () => {
    await op.run('backup', async (report) => {
      const result = await performBackup(window.localStorage, report);
      pendingDownload.current = { fileName: result.fileName, bytes: result.zipBytes };
      setLastBackupAt(new Date().toISOString());
      return `${result.totalTasks} tugas terarsipkan (${formatBytes(result.zipBytes.length)}).`;
    });
  }, [op]);

  // Unduhan dipicu begitu operasi selesai (modal masih terbuka, tombol "Selesai" aktif)
  useEffect(() => {
    if (op.finished && pendingDownload.current) {
      const { fileName, bytes } = pendingDownload.current;
      pendingDownload.current = null;
      try {
        const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } catch {
        showToast('err', 'Unduhan gagal dipicu oleh browser.');
      }
    }
  }, [op.finished, showToast]);

  /* ---------- RESTORE ---------- */
  const onPickRestoreFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        showToast('err', 'Ukuran file melebihi 10 MB — kemungkinan bukan backup Luxe Kanban.');
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => showToast('err', 'File tidak dapat dibaca.');
      reader.onload = () => {
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        setModal({ kind: 'restore-confirm', bytes, fileName: file.name });
      };
      reader.readAsArrayBuffer(file);
    },
    [showToast],
  );

  const handleRestore = useCallback(
    async (bytes: Uint8Array, fileName: string) => {
      setModal({ kind: 'none' });
      await op.run('restore', async (report) => {
        const result = await performRestore(window.localStorage, bytes, fileName, report);
        const fresh = readAllTasks(window.localStorage);
        setBoard(fresh);
        setRestoreInfo(`Restore terakhir: ${formatTimestamp(new Date().toISOString())} — ${result.totalTasks} tugas.`);
        return `${result.totalTasks} tugas dimuat dari backup.`;
      });
    },
    [op, showToast],
  );

  const handleReset = useCallback(() => {
    commit({ todo: [], doing: [], done: [] });
    setModal({ kind: 'none' });
    showToast('ok', 'Papan dikosongkan.');
  }, [commit, showToast]);

  /* ---------- kunci halaman selama operasi berjalan ---------- */
  useEffect(() => {
    document.body.style.overflow = op.active ? 'hidden' : '';
    if (op.active) {
      document.body.dataset[PAGE_LOCK] = '1';
    } else {
      delete document.body.dataset[PAGE_LOCK];
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [op.active]);

  const total = countTasks(board);

  return (
    <AppShell
      totalTasks={total}
      lastBackupLabel={formatTimestamp(lastBackupAt)}
      onBackup={handleBackup}
      onRestoreClick={() => fileInputRef.current?.click()}
      onResetClick={() => setModal({ kind: 'reset' })}
      busy={op.active}
    >
      {/* input restore tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,application/zip"
        style={{ display: 'none' }}
        onChange={(e) => {
          onPickRestoreFile(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />

      {!ready ? (
        <div className="board" aria-busy="true">
          {STATUSES.map((s) => (
            <div key={s} className="column" style={{ opacity: 0.6 }}>
              <div className="column-head">
                <h2 className="column-title">{STATUS_META[s].label}</h2>
              </div>
              <div className="column-body">
                <div className="drop-hint">Memuat…</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <main className="board">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={board[status]}
              busyTaskId={busyTaskId}
              isDropActive={draggingTask && dropTarget === status}
              onAddClick={() => setModal({ kind: 'task-create', status })}
              onOpenTask={(task) => setModal({ kind: 'task-edit', task })}
              onDeleteTask={(task) => setModal({ kind: 'delete-task', task })}
              onStatusChange={handleStatusChange}
              onDragStartTask={() => setDraggingTask(true)}
              onDragEndTask={() => {
                setDraggingTask(false);
                setDropTarget(null);
              }}
              onDragOverColumn={(s) => setDropTarget(s)}
              onDragLeaveColumn={(s) => setDropTarget((cur) => (cur === s ? null : cur))}
              onDropInColumn={handleDrop}
            />
          ))}
        </main>
      )}

      <footer className="app-foot">
        <span>
          Data disimpan lokal di perangkat Anda.    &copy; 2026 - Alzam A.
        </span>
      </footer>

      {/* ---------- modals ---------- */}
      {modal.kind === 'task-create' ? (
        <TaskModal
          mode="create"
          defaultStatus={modal.status}
          saving={saving}
          onSubmit={(values) => handleCreate(modal.kind === 'task-create' ? modal.status : 'todo', values)}
          onClose={() => setModal({ kind: 'none' })}
        />
      ) : null}

      {modal.kind === 'task-edit' ? (
        <TaskModal
          mode="edit"
          task={modal.task}
          defaultStatus={modal.task.status}
          saving={saving}
          onSubmit={(values) => handleUpdate(modal.kind === 'task-edit' ? modal.task.id : '', values)}
          onClose={() => setModal({ kind: 'none' })}
        />
      ) : null}

      {modal.kind === 'delete-task' ? (
        <ConfirmModal
          title="Hapus Tugas"
          confirmLabel="Hapus"
          message={
            <>
              Tugas <strong>“{modal.task.title}”</strong> akan dihapus permanen dari papan. Tindakan ini tidak dapat
              dibatalkan (kecuali Anda punya backup).
            </>
          }
          onConfirm={() => handleDelete(modal.kind === 'delete-task' ? modal.task : ({} as Task))}
          onClose={() => setModal({ kind: 'none' })}
        />
      ) : null}

      {modal.kind === 'reset' ? (
        <ConfirmModal
          title="Kosongkan Papan"
          confirmLabel="Kosongkan"
          message={
            <>
              Seluruh tugas di ketiga kolom akan dihapus dari LocalStorage. Pertimbangkan <strong>Backup</strong>{' '}
              terlebih dahulu — tindakan ini tidak dapat dibatalkan.
            </>
          }
          onConfirm={handleReset}
          onClose={() => setModal({ kind: 'none' })}
        />
      ) : null}

      {modal.kind === 'restore-confirm' ? (
        <ConfirmModal
          title="Pulihkan dari Backup"
          confirmLabel="Muat Backup"
          message={
            <>
              File <strong>“{modal.fileName}”</strong> akan diverifikasi & divalidasi, lalu{' '}
              <strong>menimpa seluruh data saat ini</strong> di LocalStorage. Lanjutkan?
            </>
          }
          onConfirm={() =>
            handleRestore(
              modal.kind === 'restore-confirm' ? modal.bytes : new Uint8Array(),
              modal.kind === 'restore-confirm' ? modal.fileName : '',
            )
          }
          onClose={() => setModal({ kind: 'none' })}
        />
      ) : null}

      {op.mode ? (
        <OperationModal
          mode={op.mode}
          running={op.active && !op.finished}
          error={op.error}
          steps={op.steps}
          progress={op.progress}
          onClose={op.close}
        />
      ) : null}

      {/* ---------- toast ---------- */}
      {toast ? (
        <div className={`toast ${toast.kind}`} role="status">
          {toast.kind === 'ok' ? <IconArchive size={16} /> : <IconAlert size={16} />}
          <span>{toast.text}</span>
        </div>
      ) : null}
    </AppShell>
  );
}
