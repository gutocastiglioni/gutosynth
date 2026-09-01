/**
 * Non-Blocking Toast Notification Component
 * Implements Directive 19 (Explicit Visual Feedback with no silent failures)
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-xl flex items-start gap-3
            animate-slideUp transition-all duration-300
            ${
              t.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100 shadow-[0_0_20px_rgba(6,214,160,0.2)]'
                : t.type === 'error'
                ? 'bg-red-950/80 border-red-500/40 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(0,242,254,0.2)]'
            }
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-wide">{t.title}</h4>
            {t.description && <p className="text-xs opacity-80 mt-0.5">{t.description}</p>}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
