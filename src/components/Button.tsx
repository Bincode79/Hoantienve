/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  iconOnly = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconOnly?: boolean;
}) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30',
    secondary: 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30',
    ghost: 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
    outline: 'bg-transparent text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/30',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 rounded-lg',
    lg: 'px-6 py-3 rounded-xl text-base',
  };

  const iconOnlyStyles = iconOnly ? '!px-3 !py-3 aspect-square' : '';

  return (
    <button
      className={cn(
        'font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center justify-center gap-2 hover-spring focus-ring-strong',
        variants[variant],
        sizes[size],
        iconOnlyStyles,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// Removed default export
