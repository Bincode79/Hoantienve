/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';

export const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-page mesh-gradient">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary-500/20 rounded-2xl"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-2xl animate-spin"></div>
      <div className="absolute inset-4 bg-primary-500/10 rounded-xl animate-pulse"></div>
    </div>
  </div>
));

// Removed default export
