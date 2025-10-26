import React, { useState, useEffect, useRef } from 'react';

interface GridInfo {
  element: HTMLElement;
  columns: string;
  rows: string;
  gap: string;
  areas: string;
  children: HTMLElement[];
}

interface CSSGridInspectorProps {
  isActive: boolean;
  onToggle: () => void;
}

export const CSSGridInspector: React.FC<CSSGridInspectorProps> = ({ isActive, onToggle }) => {
  const [gridElements, setGridElements] = useState<GridInfo[]>([]);
  const [selectedGrid, setSelectedGrid] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find all grid elements
  const scanForGrids = () => {
    const grids = document.querySelectorAll('[style*="display: grid"], [style*="display:grid"], .grid');
    const gridInfos: GridInfo[] = [];

    grids.forEach((grid) => {
      const element = grid as HTMLElement;
      const computed = getComputedStyle(element);
      
      if (computed.display === 'grid') {
        gridInfos.push({
          element,
          columns: computed.gridTemplateColumns,
          rows: computed.gridTemplateRows,
          gap: computed.gap,
          areas: computed.gridTemplateAreas,
          children: Array.from(element.children) as HTMLElement[]
        });
      }
    });

    setGridElements(gridInfos);
  };

  // Create grid overlay
  const createGridOverlay = (gridInfo: GridInfo, index: number) => {
    const { element } = gridInfo;
    const rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    
    // Remove existing overlay
    const existingOverlay = document.getElementById(`grid-overlay-${index}`);
    if (existingOverlay) existingOverlay.remove();

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = `grid-overlay-${index}`;
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      z-index: 9999;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    `;

    // Add grid lines
    const columns = computed.gridTemplateColumns.split(' ').length;
    const rows = computed.gridTemplateRows.split(' ').length;

    // Vertical lines (columns)
    for (let i = 1; i < columns; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: ${(rect.width / columns) * i}px;
        top: 0;
        width: 1px;
        height: 100%;
        background: #ef4444;
        opacity: 0.8;
      `;
      overlay.appendChild(line);
    }

    // Horizontal lines (rows)
    for (let i = 1; i < rows; i++) {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        top: ${(rect.height / rows) * i}px;
        left: 0;
        height: 1px;
        width: 100%;
        background: #ef4444;
        opacity: 0.8;
      `;
      overlay.appendChild(line);
    }

    // Add grid numbers
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const cell = document.createElement('div');
        cell.style.cssText = `
          position: absolute;
          left: ${(rect.width / columns) * col + 4}px;
          top: ${(rect.height / rows) * row + 4}px;
          background: rgba(59, 130, 246, 0.8);
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 2px;
          font-family: monospace;
        `;
        cell.textContent = `${row + 1},${col + 1}`;
        overlay.appendChild(cell);
      }
    }

    document.body.appendChild(overlay);
  };

  // Remove all overlays
  const clearOverlays = () => {
    gridElements.forEach((_, index) => {
      const overlay = document.getElementById(`grid-overlay-${index}`);
      if (overlay) overlay.remove();
    });
  };

  // Handle grid selection
  const selectGrid = (index: number) => {
    clearOverlays();
    setSelectedGrid(index === selectedGrid ? null : index);
    
    if (index !== selectedGrid) {
      createGridOverlay(gridElements[index], index);
    }
  };

  useEffect(() => {
    if (isActive) {
      scanForGrids();
      
      // Auto-scan on window resize
      const handleResize = () => {
        if (selectedGrid !== null) {
          clearOverlays();
          setTimeout(() => {
            if (gridElements[selectedGrid]) {
              createGridOverlay(gridElements[selectedGrid], selectedGrid);
            }
          }, 100);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearOverlays();
      };
    } else {
      clearOverlays();
    }
  }, [isActive, selectedGrid, gridElements]);

  // Rescan grids
  const handleRescan = () => {
    clearOverlays();
    setSelectedGrid(null);
    scanForGrids();
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-80">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-blue-400">🔍 CSS Grid Inspector</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleRescan}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
          >
            🔄 Rescan
          </button>
          <button
            onClick={clearOverlays}
            className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
          >
            Clear
          </button>
        </div>

        {gridElements.length === 0 ? (
          <p className="text-gray-400 text-sm">No CSS Grid elements found. Try scanning again.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {gridElements.map((grid, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={selectedGrid === index}
                aria-label={`Select grid ${index + 1}`}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedGrid === index
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
                onClick={() => selectGrid(index)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-blue-300">
                    Grid {index + 1}
                  </span>
                  <span className="text-xs text-gray-400">
                    {grid.element.tagName.toLowerCase()}
                    {grid.element.className && `.${grid.element.className.split(' ')[0]}`}
                  </span>
                </div>

                <div className="text-xs text-gray-300 space-y-1">
                  <div>
                    <span className="text-yellow-400">Columns:</span> {grid.columns || 'auto'}
                  </div>
                  <div>
                    <span className="text-green-400">Rows:</span> {grid.rows || 'auto'}
                  </div>
                  <div>
                    <span className="text-purple-400">Gap:</span> {grid.gap || 'none'}
                  </div>
                  {grid.areas !== 'none' && (
                    <div>
                      <span className="text-pink-400">Areas:</span> {grid.areas}
                    </div>
                  )}
                  <div>
                    <span className="text-orange-400">Children:</span> {grid.children.length}
                  </div>
                </div>

                {selectedGrid === index && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="text-xs text-gray-400 mb-1">Grid Children:</div>
                    <div className="grid grid-cols-2 gap-1">
                      {grid.children.slice(0, 6).map((child, childIndex) => (
                        <div
                          key={childIndex}
                          className="text-xs bg-gray-700 rounded px-2 py-1 truncate"
                          title={child.className || child.tagName}
                        >
                          {child.tagName.toLowerCase()}
                          {child.className && `.${child.className.split(' ')[0]}`}
                        </div>
                      ))}
                      {grid.children.length > 6 && (
                        <div className="text-xs text-gray-500 px-2 py-1">
                          +{grid.children.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
        💡 Click on a grid to inspect it. Overlays show grid lines and cell numbers.
      </div>
    </div>
  );
};

export default CSSGridInspector;