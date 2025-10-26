'use client';

import { Source } from '@/types';
import { ExternalLink, FileText } from 'lucide-react';

interface SourceCitationProps {
  source: Source;
  index: number;
}

export function SourceCitation({ source, index }: SourceCitationProps) {
  const similarity = Math.round(source.similarity * 100);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
    >
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
        {index}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
          <FileText className="w-3 h-3" />
          <span className="truncate">
            {source.repository}/{source.path}
          </span>
          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {similarity}% relevance
        </div>
      </div>
    </a>
  );
}
