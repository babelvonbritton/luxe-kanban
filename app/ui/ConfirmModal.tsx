'use client';

/** Dialog konfirmasi (hapus tugas / reset papan). */
import { Modal } from './Modal';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  return (
    <Modal
      narrow
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn subtle" onClick={onClose}>
            Batal
          </button>
          <button className="btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{message}</p>
    </Modal>
  );
}
