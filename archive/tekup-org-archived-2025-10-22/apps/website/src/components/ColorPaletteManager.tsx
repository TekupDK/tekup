import React, { useState, useEffect, useCallback } from 'react';
import { onActivate } from '@/lib/a11y';

interface Color {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  hsl: string;
  p3: string;
  usage: string[];
}

interface ColorPalette {
  id: string;
  name: string;
  colors: Color[];
  isP3Compatible: boolean;
}

interface ColorPaletteManagerProps {
  isActive: boolean;
  onToggle: () => void;
}

export const ColorPaletteManager: React.FC<ColorPaletteManagerProps> = ({ isActive, onToggle }) => {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#ff0000');
  const [colorFormats, setColorFormats] = useState<'hex' | 'rgb' | 'hsl' | 'p3'>('hex');

  // Default Tailwind-inspired P3 palette
  const defaultPalette: ColorPalette = {
    id: 'default-p3',
    name: 'Tailwind P3 Enhanced',
    isP3Compatible: true,
    colors: [
      {
        id: '1',
        name: 'P3 Blue',
        hex: '#0066ff',
        rgb: 'rgb(0, 102, 255)',
        hsl: 'hsl(216, 100%, 50%)',
        p3: 'color(display-p3 0 0.4 1)',
        usage: ['primary', 'links', 'buttons']
      },
      {
        id: '2',
        name: 'P3 Red',
        hex: '#ff0040',
        rgb: 'rgb(255, 0, 64)',
        hsl: 'hsl(345, 100%, 50%)',
        p3: 'color(display-p3 1 0 0.25)',
        usage: ['error', 'danger', 'alerts']
      },
      {
        id: '3',
        name: 'P3 Green',
        hex: '#00ff80',
        rgb: 'rgb(0, 255, 128)',
        hsl: 'hsl(150, 100%, 50%)',
        p3: 'color(display-p3 0 1 0.5)',
        usage: ['success', 'positive', 'nature']
      },
      {
        id: '4',
        name: 'P3 Purple',
        hex: '#8000ff',
        rgb: 'rgb(128, 0, 255)',
        hsl: 'hsl(270, 100%, 50%)',
        p3: 'color(display-p3 0.5 0 1)',
        usage: ['accent', 'creative', 'premium']
      },
      {
        id: '5',
        name: 'P3 Cyan',
        hex: '#00ffff',
        rgb: 'rgb(0, 255, 255)',
        hsl: 'hsl(180, 100%, 50%)',
        p3: 'color(display-p3 0 1 1)',
        usage: ['info', 'highlight', 'water']
      },
      {
        id: '6',
        name: 'P3 Orange',
        hex: '#ff8000',
        rgb: 'rgb(255, 128, 0)',
        hsl: 'hsl(30, 100%, 50%)',
        p3: 'color(display-p3 1 0.5 0)',
        usage: ['warning', 'energy', 'warm']
      }
    ]
  };

  // Initialize with default palette
  useEffect(() => {
    if (palettes.length === 0) {
      setPalettes([defaultPalette]);
      setSelectedPalette(defaultPalette.id);
    }
  }, []);

  // Convert hex to various formats
  const convertColor = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // RGB
    const rgb = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

    // HSL conversion
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }

    const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

    // P3 (approximate conversion)
    const p3 = `color(display-p3 ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)})`;

    return { rgb, hsl, p3 };
  }, []);

  // Add new color to current palette
  const addColor = () => {
    if (!selectedPalette || !newColorName || !newColorHex) return;

    const conversions = convertColor(newColorHex);
    const newColor: Color = {
      id: Date.now().toString(),
      name: newColorName,
      hex: newColorHex,
      ...conversions,
      usage: []
    };

    setPalettes(prev => prev.map(palette => 
      palette.id === selectedPalette 
        ? { ...palette, colors: [...palette.colors, newColor] }
        : palette
    ));

    setNewColorName('');
    setNewColorHex('#ff0000');
  };

  // Remove color from palette
  const removeColor = (colorId: string) => {
    setPalettes(prev => prev.map(palette =>
      palette.id === selectedPalette
        ? { ...palette, colors: palette.colors.filter(c => c.id !== colorId) }
        : palette
    ));
  };

  // Extract colors from current page
  const extractColorsFromPage = () => {
    const elements = document.querySelectorAll('*');
    const colorSet = new Set<string>();
    
    elements.forEach(el => {
      const computed = getComputedStyle(el);
      [computed.color, computed.backgroundColor, computed.borderColor].forEach(color => {
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'rgb(0, 0, 0)' && color !== 'transparent') {
          colorSet.add(color);
        }
      });
    });

    const extractedColors: Color[] = Array.from(colorSet).slice(0, 20).map((color, index) => {
      // Convert rgb to hex for consistency
      const rgb = color.match(/\d+/g);
      if (!rgb) return null;
      
      const hex = '#' + rgb.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');

      const conversions = convertColor(hex);
      
      return {
        id: `extracted-${index}`,
        name: `Extracted ${index + 1}`,
        hex,
        ...conversions,
        usage: ['page-element']
      };
    }).filter(Boolean) as Color[];

    // Create extracted colors palette
    const extractedPalette: ColorPalette = {
      id: 'extracted',
      name: 'Page Extracted',
      isP3Compatible: false,
      colors: extractedColors
    };

    setPalettes(prev => [extractedPalette, ...prev.filter(p => p.id !== 'extracted')]);
    setSelectedPalette('extracted');
  };

  // Generate harmonious color palette
  const generateHarmoniousPalette = (baseHex: string) => {
    const baseHue = convertHexToHue(baseHex);
    const harmonies = [
      { name: 'Analogous 1', hue: (baseHue + 30) % 360 },
      { name: 'Analogous 2', hue: (baseHue - 30 + 360) % 360 },
      { name: 'Complementary', hue: (baseHue + 180) % 360 },
      { name: 'Triadic 1', hue: (baseHue + 120) % 360 },
      { name: 'Triadic 2', hue: (baseHue + 240) % 360 },
    ];

    const generatedColors: Color[] = harmonies.map((harmony, index) => {
      const hex = hueToHex(harmony.hue, 70, 50);
      const conversions = convertColor(hex);
      
      return {
        id: `harmony-${index}`,
        name: harmony.name,
        hex,
        ...conversions,
        usage: ['generated']
      };
    });

    const harmoniousPalette: ColorPalette = {
      id: 'harmonious',
      name: 'Color Harmony',
      isP3Compatible: true,
      colors: generatedColors
    };

    setPalettes(prev => [harmoniousPalette, ...prev.filter(p => p.id !== 'harmonious')]);
    setSelectedPalette('harmonious');
  };

  // Helper functions
  const convertHexToHue = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;

    if (max !== min) {
      const d = max - min;
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return h * 360;
  };

  const hueToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c/2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  };

  // Copy color to clipboard
  const copyColor = async (color: Color) => {
    const formats = {
      hex: color.hex,
      rgb: color.rgb,
      hsl: color.hsl,
      p3: color.p3
    };
    
    await navigator.clipboard.writeText(formats[colorFormats]);
    setSelectedColor(color);
    setTimeout(() => setSelectedColor(null), 1000);
  };

  const currentPalette = palettes.find(p => p.id === selectedPalette);

  if (!isActive) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-96">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-purple-400">🎨 Color Palette Manager</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4">
        {/* Palette Selection */}
        <div className="mb-4">
          <label className="text-sm text-gray-300 block mb-2">Active Palette:</label>
          <select
            value={selectedPalette || ''}
            onChange={(e) => setSelectedPalette(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 text-sm"
          >
            {palettes.map(palette => (
              <option key={palette.id} value={palette.id}>
                {palette.name} {palette.isP3Compatible && '(P3)'}
              </option>
            ))}
          </select>
        </div>

        {/* Color Format Toggle */}
        <div className="flex gap-1 mb-4 p-1 bg-gray-800 rounded">
          {(['hex', 'rgb', 'hsl', 'p3'] as const).map(format => (
            <button
              key={format}
              onClick={() => setColorFormats(format)}
              className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
                colorFormats === format 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Current Palette Colors */}
        {currentPalette && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">
                Colors ({currentPalette.colors.length})
              </span>
              {currentPalette.isP3Compatible && (
                <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">P3</span>
              )}
            </div>
            
            <div className="grid grid-cols-6 gap-2 mb-4">
              {currentPalette.colors.map(color => (
                <div
                  key={color.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedColor?.id === color.id ? 'border-white scale-110' : 'border-transparent hover:border-gray-400'
                  }`}
                  onClick={() => copyColor(color)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Copy ${color.name} in ${colorFormats.toUpperCase()} format`}
                  aria-pressed={selectedColor?.id === color.id}
                  onKeyDown={onActivate(() => copyColor(color))}
                  title={`${color.name}: ${color[colorFormats]}`}
                >
                  <div
                    className="h-12 w-full"
                    style={{ 
                      background: colorFormats === 'p3' && color.p3.includes('display-p3') 
                        ? color.p3 
                        : color.hex 
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {color.name}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColor(color.id);
                    }}
                    className="absolute top-0 right-0 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Color */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Add Color</h4>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Color name"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded p-2 text-sm"
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer"
            />
          </div>
          <button
            onClick={addColor}
            className="w-full bg-purple-600 text-white text-sm py-2 rounded hover:bg-purple-500 transition-colors"
          >
            Add Color
          </button>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={extractColorsFromPage}
            className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-500 transition-colors"
          >
            🔍 Extract from Page
          </button>
          <button
            onClick={() => generateHarmoniousPalette(newColorHex)}
            className="w-full bg-green-600 text-white text-sm py-2 rounded hover:bg-green-500 transition-colors"
          >
            🎨 Generate Harmony
          </button>
        </div>

        {/* Current Color Display */}
        {selectedColor && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-purple-500">
            <div className="text-sm text-purple-300 mb-2">Copied to Clipboard!</div>
            <div className="text-sm space-y-1">
              <div><span className="text-gray-400">Name:</span> {selectedColor.name}</div>
              <div><span className="text-gray-400">HEX:</span> <code className="bg-gray-700 px-1 rounded">{selectedColor.hex}</code></div>
              <div><span className="text-gray-400">RGB:</span> <code className="bg-gray-700 px-1 rounded">{selectedColor.rgb}</code></div>
              <div><span className="text-gray-400">HSL:</span> <code className="bg-gray-700 px-1 rounded">{selectedColor.hsl}</code></div>
              <div><span className="text-gray-400">P3:</span> <code className="bg-gray-700 px-1 rounded text-xs">{selectedColor.p3}</code></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-400">
        💡 Click colors to copy in selected format. P3 colors show enhanced gamut on compatible displays.
      </div>
    </div>
  );
};

export default ColorPaletteManager;