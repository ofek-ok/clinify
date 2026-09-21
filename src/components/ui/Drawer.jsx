import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, width = 'max-w-lg', footer }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden dir-rtl">
      <button
        type="button"
        aria-label="סגור חלונית"
        className="fixed inset-0 bg-slate-950/35"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <section className={`flex w-screen ${width} flex-col border-r border-slate-200 bg-white text-slate-900 shadow-xl`}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {children}
          </div>

          {footer && (
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              {footer}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
