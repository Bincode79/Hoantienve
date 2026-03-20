/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatMessage } from '../types';
import { formatDate } from '../utils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ChatBubble: React.FC<{ message: ChatMessage; isOwn: boolean; key?: any }> = memo(({ message, isOwn }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
    <div
      className={cn(
        'max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-300',
        isOwn
          ? 'bg-primary-600 text-white rounded-tr-none shadow-primary-500/10'
          : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-none border border-neutral-200 dark:border-neutral-700'
      )}
    >
      {!isOwn && (
        <p className="text-[10px] font-bold mb-1 opacity-60 uppercase tracking-widest">{message.senderName}</p>
      )}
      <p className="leading-relaxed">{message.text}</p>
      <p className={`text-[10px] mt-1.5 font-medium opacity-60 ${isOwn ? 'text-white' : 'text-neutral-500'} text-right`}>
        {formatDate(message.timestamp, 'HH:mm')}
      </p>
    </div>
  </div>
));

export default ChatBubble;
