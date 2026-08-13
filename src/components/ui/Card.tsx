import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={twMerge(
      clsx(
        'rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl transition-all duration-200',
        className
      )
    )}
    {...props}
  />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={twMerge(clsx('flex flex-col space-y-1.5 p-5', className))} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={twMerge(clsx('text-lg font-semibold leading-none tracking-tight text-slate-100', className))} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={twMerge(clsx('text-xs text-slate-400', className))} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={twMerge(clsx('p-5 pt-0', className))} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={twMerge(clsx('flex items-center p-5 pt-0', className))} {...props} />
);
