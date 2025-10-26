'use client';

import { Bot } from 'lucide-react';

export function StreamingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>

      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Thinking...
          </span>
        </div>
      </div>
    </div>
  );
}
