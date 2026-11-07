'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Status } from './types';

export type Locale = 'id' | 'en-US';
type MessageKey = keyof typeof messages.id;

const messages = {
  id: {
    language: 'Bahasa',
    indonesian: 'Indonesia',
    english: 'English (US)',
    tasks: 'tugas',
    todo: 'Akan Dilakukan',
    doing: 'Sedang Dikerjakan',
    done: 'Selesai',
    todoHint: 'Tugas yang menunggu untuk dimulai',
    doingHint: 'Tugas yang sedang dikerjakan',
    doneHint: 'Tugas yang telah rampung',
    dragToMove: 'Tarik untuk memindahkan',
    changeStatus: 'Ubah status tugas: {title}',
    changeStatusShort: 'Ganti status',
    chooseStatus: 'Pilih status baru',
    current: 'saat ini',
    editTask: 'Edit tugas: {title}',
    deleteTask: 'Hapus tugas: {title}',
    updated: 'Diperbarui {date}',
    addTask: 'Tambah tugas',
    emptyColumn: 'Tarik kartu ke sini — kolom ini masih kosong.',
    dataStoredLocally: 'Data disimpan secara lokal di perangkat Anda.',
    lastBackup: 'Backup terakhir: {date}',
    restore: 'Pulihkan',
    backupZip: 'Backup ZIP',
    reset: 'Reset',
    resetBoard: 'Kosongkan seluruh papan',
    premiumBoard: 'Premium Task Board',
    createTask: 'Tugas Baru',
    editTaskTitle: 'Edit Tugas',
    addTaskSubtitle: 'Tambahkan tugas ke papan Anda.',
    cancel: 'Batal',
    saving: 'Menyimpan…',
    add: 'Tambahkan',
    saveChanges: 'Simpan Perubahan',
    title: 'Judul',
    titlePlaceholder: 'cth. Finalisasi proposal klien',
    descriptionOptional: 'Deskripsi (opsional)',
    descriptionPlaceholder: 'Tambahkan detail, tautan, atau catatan…',
    placeInColumn: 'Tempatkan di kolom',
    status: 'Status',
    requiredTitle: 'Judul tugas wajib diisi.',
    closeDialog: 'Tutup dialog',
    deleteTaskTitle: 'Hapus Tugas',
    delete: 'Hapus',
    deleteTaskConfirm: 'Tugas “{title}” akan dihapus permanen dari papan. Tindakan ini tidak dapat dibatalkan (kecuali Anda punya backup).',
    clearBoardTitle: 'Kosongkan Papan',
    clear: 'Kosongkan',
    clearBoardConfirm: 'Seluruh tugas di ketiga kolom akan dihapus dari penyimpanan lokal. Pertimbangkan untuk membuat backup terlebih dahulu — tindakan ini tidak dapat dibatalkan.',
    restoreTitle: 'Pulihkan dari Backup',
    loadBackup: 'Muat Backup',
    restoreConfirm: 'File “{fileName}” akan diverifikasi dan divalidasi, lalu menimpa seluruh data saat ini di penyimpanan lokal. Lanjutkan?',
    operationBackup: 'Backup',
    operationRestore: 'Pulihkan',
    waitDontClose: 'Mohon tunggu — jangan tutup halaman ini.',
    operationError: 'Proses berakhir dengan kesalahan.',
    operationComplete: 'Proses selesai.',
    processingLocked: 'Memproses… UI terkunci hingga selesai',
    close: 'Tutup',
    complete: 'Selesai',
    operationStopped: 'Operasi dihentikan.',
    loading: 'Memuat…',
    addedToast: 'Tugas baru ditambahkan.',
    savedToast: 'Perubahan disimpan.',
    deletedToast: 'Tugas dihapus.',
    boardClearedToast: 'Papan dikosongkan.',
    backupSummary: '{count} tugas diarsipkan ({size}).',
    restoreSummary: '{count} tugas dimuat dari backup.',
    restoreLast: 'Pemulihan terakhir: {date} — {count} tugas.',
    downloadFailed: 'Browser gagal memulai unduhan.',
    fileTooLarge: 'File lebih besar dari 10 MB. File ini mungkin bukan backup Luxe Kanban.',
    fileUnreadable: 'File tidak dapat dibaca.',
    localStorageUnavailable: 'Penyimpanan lokal tidak dapat diakses.',
    storageSaveFailed: 'Gagal menyimpan ke penyimpanan lokal.',
    createFailed: 'Gagal menambahkan tugas.',
    saveFailed: 'Gagal menyimpan perubahan.',
    unknownError: 'Terjadi kesalahan yang tidak diketahui.',
    backupSteps: 'Backup Data',
    restoreSteps: 'Pulihkan Data',
    stepVerify: 'Memverifikasi arsip',
    stepValidate: 'Memvalidasi data',
    stepLoad: 'Memuat data',
    stepFinish: 'Menyelesaikan',
    stepPending: 'Menunggu',
    stepActive: 'Memproses…',
    stepDone: 'Selesai',
    stepError: 'Gagal',
    backupVerifyDetail: 'Menyiapkan arsip ZIP dari data tersimpan.',
    restoreVerifyDetail: 'Memeriksa tanda tangan ZIP dan kelengkapan file.',
    validateDetail: 'Memeriksa struktur dan isi setiap penyimpanan.',
    backupLoadDetail: 'Mengompres data menjadi arsip ZIP.',
    restoreLoadDetail: 'Menyimpan data tervalidasi ke penyimpanan lokal.',
    finishDetail: 'Merapikan status dan menyiapkan kembali antarmuka.',
    archiveReady: 'Backup selesai',
    restoreReady: 'Pemulihan selesai',
  },
  'en-US': {
    language: 'Language',
    indonesian: 'Indonesian',
    english: 'English (US)',
    tasks: 'tasks',
    todo: 'To Do',
    doing: 'In Progress',
    done: 'Done',
    todoHint: 'Tasks waiting to get started',
    doingHint: 'Tasks currently being worked on',
    doneHint: 'Tasks that are complete',
    dragToMove: 'Drag to move',
    changeStatus: 'Change status for {title}',
    changeStatusShort: 'Change status',
    chooseStatus: 'Choose a new status',
    current: 'current',
    editTask: 'Edit task: {title}',
    deleteTask: 'Delete task: {title}',
    updated: 'Updated {date}',
    addTask: 'Add task',
    emptyColumn: 'Drop a card here to get started.',
    dataStoredLocally: 'Your data is stored locally on this device.',
    lastBackup: 'Last backup: {date}',
    restore: 'Restore',
    backupZip: 'Download ZIP Backup',
    reset: 'Reset',
    resetBoard: 'Clear the entire board',
    premiumBoard: 'Premium Task Board',
    createTask: 'New Task',
    editTaskTitle: 'Edit Task',
    addTaskSubtitle: 'Add a task to your board.',
    cancel: 'Cancel',
    saving: 'Saving…',
    add: 'Add Task',
    saveChanges: 'Save Changes',
    title: 'Title',
    titlePlaceholder: 'e.g., Finalize the client proposal',
    descriptionOptional: 'Description (optional)',
    descriptionPlaceholder: 'Add details, links, or notes…',
    placeInColumn: 'Add to column',
    status: 'Status',
    requiredTitle: 'Please enter a task title.',
    closeDialog: 'Close dialog',
    deleteTaskTitle: 'Delete Task',
    delete: 'Delete',
    deleteTaskConfirm: '“{title}” will be permanently deleted from the board. This can’t be undone unless you have a backup.',
    clearBoardTitle: 'Clear Board',
    clear: 'Clear Board',
    clearBoardConfirm: 'All tasks in all three columns will be deleted from local storage. Consider creating a backup first. This can’t be undone.',
    restoreTitle: 'Restore from Backup',
    loadBackup: 'Restore Backup',
    restoreConfirm: '“{fileName}” will be verified and validated, then replace all data currently in local storage. Do you want to continue?',
    operationBackup: 'Back Up',
    operationRestore: 'Restore',
    waitDontClose: 'Please wait—don’t close this page.',
    operationError: 'The operation ended with an error.',
    operationComplete: 'The operation is complete.',
    processingLocked: 'Working… The interface will be available when this finishes.',
    close: 'Close',
    complete: 'Done',
    operationStopped: 'Operation stopped.',
    loading: 'Loading…',
    addedToast: 'Task added.',
    savedToast: 'Changes saved.',
    deletedToast: 'Task deleted.',
    boardClearedToast: 'Board cleared.',
    backupSummary: '{count} {count, plural, one {task} other {tasks}} archived ({size}).',
    restoreSummary: '{count} {count, plural, one {task} other {tasks}} restored from backup.',
    restoreLast: 'Last restored: {date} — {count} {count, plural, one {task} other {tasks}}.',
    downloadFailed: 'Your browser couldn’t start the download.',
    fileTooLarge: 'This file is larger than 10 MB. It may not be a Luxe Kanban backup.',
    fileUnreadable: 'The file couldn’t be read.',
    localStorageUnavailable: 'Local storage is unavailable.',
    storageSaveFailed: 'Couldn’t save to local storage.',
    createFailed: 'Couldn’t add the task.',
    saveFailed: 'Couldn’t save your changes.',
    unknownError: 'Something went wrong.',
    backupSteps: 'Back Up Data',
    restoreSteps: 'Restore Data',
    stepVerify: 'Verify archive',
    stepValidate: 'Validate data',
    stepLoad: 'Load data',
    stepFinish: 'Finish up',
    stepPending: 'Waiting',
    stepActive: 'Working…',
    stepDone: 'Done',
    stepError: 'Failed',
    backupVerifyDetail: 'Preparing a ZIP archive from your saved data.',
    restoreVerifyDetail: 'Checking the ZIP signature and required files.',
    validateDetail: 'Checking the structure and contents of each data store.',
    backupLoadDetail: 'Compressing your data into a ZIP archive.',
    restoreLoadDetail: 'Saving validated data to local storage.',
    finishDetail: 'Wrapping up and getting the interface ready.',
    archiveReady: 'Backup complete',
    restoreReady: 'Restore complete',
  },
} as const;

type MessageParams = Record<string, string | number>;
type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: MessageParams) => string;
  statusLabel: (status: Status) => string;
  statusHint: (status: Status) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, params: MessageParams = {}) {
  return template.replace(/\{(\w+)(?:,\s*plural,\s*one\s*\{[^}]*\}\s*other\s*\{([^}]*)\})?\}/g, (match, key: string, pluralOther: string) => {
    if (pluralOther) {
      const count = Number(params[key]);
      return count === 1 ? '1 task' : `${count} tasks`;
    }
    return String(params[key] ?? match);
  });
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id');

  useEffect(() => {
    const saved = window.localStorage.getItem('lkLocale');
    if (saved === 'en-US' || saved === 'id') setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'en-US' ? 'en-US' : 'id';
    window.localStorage.setItem('lkLocale', locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: (key, params) => interpolate(messages[locale][key], params),
    statusLabel: (status) => messages[locale][status],
    statusHint: (status) => messages[locale][`${status}Hint` as 'todoHint' | 'doingHint' | 'doneHint'],
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}

export function localeTag(locale: Locale) {
  return locale === 'en-US' ? 'en-US' : 'id-ID';
}
