import * as React from 'react';

export function Badge({ className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${className}`} {...props} />;
}
