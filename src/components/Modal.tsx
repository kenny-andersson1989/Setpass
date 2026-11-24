import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, children, full }: { open: boolean; onClose: () => void; children: ReactNode; full?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('noscroll');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('noscroll'); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className={full ? 'modal modal-full' : 'modal'} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body
  );
}

export interface ActionItem { label: string; onClick: () => void; danger?: boolean }

export function ActionSheet({ open, onClose, items, title }: { open: boolean; onClose: () => void; items: ActionItem[]; title?: string }) {
  return (
    <Modal open={open} onClose={onClose}>
      {title && <div className="sheet-title">{title}</div>}
      <div className="sheet-actions">
        {items.map((it) => (
          <button key={it.label} className={it.danger ? 'sheet-btn danger' : 'sheet-btn'} onClick={() => { onClose(); it.onClick(); }}>
            {it.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
