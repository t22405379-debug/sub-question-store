import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-6xl w-[95vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog Body */}
      <div
        className={`relative z-10 w-full ${maxWidths[maxWidth]} rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/80 overflow-hidden transform animate-slide-up`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div>
              {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
              {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-200 rounded-lg -mr-2"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
