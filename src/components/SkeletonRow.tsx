/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const SkeletonRow: React.FC<{ cols?: number; key?: any }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="skeleton h-4 w-3/4"></div>
      </td>
    ))}
  </tr>
);

// Removed default export
