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

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'blue' | 'amber' | 'emerald' | 'rose' | 'violet';
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({ label, value, icon, accent = 'blue' }) => {
  const accentColors = {
    blue: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-5 cursor-default group relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center border transition-colors duration-300 group-hover:bg-opacity-20", accentColors[accent])}>
          {React.isValidElement<{ size?: number }>(icon)
            ? React.cloneElement(icon, { size: 18 })
            : icon}
        </div>
      </div>
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
      <div key={String(value)} className="animate-count mt-1">
        <h3 className="text-2xl font-black text-blue-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

export default AnimatedStatCard;
