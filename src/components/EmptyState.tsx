/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Ticket } from 'lucide-react';

export const EmptyState = ({ message = 'Chưa có dữ liệu', icon }: { message?: string; icon?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-600">
      {icon || <Ticket size={32} />}
    </div>
    <p className="text-gray-600 text-sm font-medium">{message}</p>
  </div>
);

// Removed default export
