/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';

export const LoadingSpinner = memo(() => (
  <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
    <div className="relative group">
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Spinner body */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/10 rounded-2xl shadow-2xl"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-white border-t-transparent rounded-2xl animate-spin [animation-duration:800ms]"></div>
        <div className="absolute inset-4 bg-white/10 rounded-xl animate-pulse backdrop-blur-sm"></div>
      </div>
      
      <div className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-white/60 text-xs font-medium tracking-widest uppercase animate-pulse">Đang tải hệ thống...</span>
      </div>
    </div>
  </div>
));

// Removed default export
