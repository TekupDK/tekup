import React from 'react';
import { ChatMode } from '../../../shared/types/chatbot';
import { Zap, User } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
      <button
        onClick={() => onModeChange('standard')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          currentMode === 'standard'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
      >
        <User size={16} />
        <span>Standard</span>
      </button>
      
      <button
        onClick={() => onModeChange('smarter')}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          currentMode === 'smarter'
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
      >
        <Zap size={16} />
        <span>Smarter</span>
      </button>
    </div>
  );
};

// Mode descriptions for tooltips or help text
export const getModeDescription = (mode: ChatMode): string => {
  switch (mode) {
    case 'standard':
      return 'Quick responses for common email tasks. Fast and efficient.';
    case 'smarter':
      return 'Advanced AI with deeper understanding and complex reasoning. More powerful but slower.';
    default:
      return '';
  }
};

// Mode capabilities for UI hints
export const getModeCapabilities = (mode: ChatMode): string[] => {
  switch (mode) {
    case 'standard':
      return [
        'Email composition',
        'Quick replies',
        'Basic search',
        'Simple summaries'
      ];
    case 'smarter':
      return [
        'Advanced email analysis',
        'Complex workflows',
        'Pattern recognition',
        'Proactive suggestions',
        'Multi-step reasoning',
        'Context awareness'
      ];
    default:
      return [];
  }
};