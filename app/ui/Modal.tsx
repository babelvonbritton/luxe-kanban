'use client';

/** Modal generik: overlay + panel + tutup via X / backdrop / Escape. */
import { useEffect } from 'react';
import { IconX } from './Icons';

interface Props {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  closeable?: boolean;
  narrow?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ title, subtitle, onClose, closeable = true, narrow, children, footer }: Props) {
  useEffect(() => {
    if (!closeable || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeable, onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (closeable && onClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${narrow ? ' narrow' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle ? <p className="modal-sub">{subtitle}</p> : null}
          </div>
          {closeable && onClose ? (
            <button className="icon-btn" onClick={onClose} aria-label="Tutup dialog">
              <IconX />
            </button>
          ) : null}
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
