import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={twMerge(
              clsx(
                'w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
                icon && 'pl-10',
                error && 'border-rose-500/80 focus:ring-rose-500',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 mt-1 pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
