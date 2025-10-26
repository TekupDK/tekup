/**
 * CSV Export Utility
 * Provides functions to export data to CSV format with proper Danish formatting
 */

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  // Create header row
  const headerRow = headers.map(h => `"${h.label}"`).join(';');

  // Create data rows
  const dataRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header.key];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return '""';
        }
        
        if (value instanceof Date) {
          return `"${formatDateDanish(value)}"`;
        }
        
        if (typeof value === 'number') {
          return `"${formatNumberDanish(value)}"`;
        }
        
        if (typeof value === 'boolean') {
          return `"${value ? 'Ja' : 'Nej'}"`;
        }
        
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        // Handle objects and anything else by converting to JSON
        try {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } catch {
          return '""';
        }
      })
      .join(';');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Format date in Danish locale
 */
function formatDateDanish(date: Date): string {
  return new Date(date).toLocaleDateString('da-DK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format number in Danish locale
 */
function formatNumberDanish(num: number): string {
  return num.toLocaleString('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for proper Excel UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers: { key: keyof T; label: string }[],
  filename: string
): void {
  const csvContent = convertToCSV(data, headers);
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}.csv`;
  downloadCSV(csvContent, fullFilename);
}
