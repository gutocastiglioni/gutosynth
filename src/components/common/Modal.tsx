/**
 * Universal Anti-Trap Modal Component
 * Implements Directive 5 (ESC key dismissal, backdrop click, explicit cancel/close buttons)
 */

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'cyan' | 'purple' | 'magenta' | 'amber' | 'danger';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  subtitle,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'cyan',
  maxWidth = 'md',
  children
}) => {
  // ESC key listener for anti-trap guarantee
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'md':
      default:
        return 'max-w-lg';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Click to Dismiss */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      {/* Modal Container */}
      <div
        className={`
          relative w-full ${getMaxWidthClass()} z-10 glass-panel-elevated rounded-2xl
          border border-white/20 shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden
          flex flex-col max-h-[90vh] animate-scaleUp
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide font-display">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>

        {/* Footer with Anti-Trap Cancel & Confirm Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/30">
          <Button variant="ghost" size="md" onClick={onClose}>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button variant={confirmVariant} size="md" onClick={onConfirm}>
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
