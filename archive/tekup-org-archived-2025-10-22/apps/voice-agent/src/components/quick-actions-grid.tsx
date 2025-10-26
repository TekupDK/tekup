'use client';

import React from 'react';
import { TenantSettings, DANISH_VOICE_COMMANDS, getCommandsByCategory, createLogger } from '@/shims/tekup-shared';

interface QuickActionsGridProps {
  tenant: string;
  settings: TenantSettings | null;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ tenant, settings }) => {
  const logger = createLogger('apps-voice-agent-src-component');

  const executeVoiceCommand = (command: string) => {
    logger.info(`🎯 Executing voice command: ${command}`);
    // Her ville vi normalt sende kommandoen til voice systemet
  };

  const quickActions = [
    { icon: '📋', label: 'Vis Leads', command: 'vis alle leads', color: 'blue' },
    { icon: '➕', label: 'Ny Lead', command: 'opret ny lead', color: 'green' },
    { icon: '💾', label: 'Start Backup', command: 'start backup', color: 'purple' },
    { icon: '✅', label: 'Compliance', command: 'kør compliance check', color: 'yellow' },
    { icon: '🔍', label: 'Søg', command: 'søg efter kunde', color: 'indigo' },
    { icon: '📊', label: 'Metrics', command: 'vis metrics', color: 'orange' }
  ];

  const getCommandsByCategory = (category: string) => {
    return DANISH_VOICE_COMMANDS.filter(cmd => cmd.category === category);
  };

  const leadCommands = getCommandsByCategory('leads');
  const complianceCommands = getCommandsByCategory('compliance');
  const backupCommands = getCommandsByCategory('backup');

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
        <h2 className="text-lg font-semibold text-neutral-200 mb-4">
          🚀 Hurtige Kommandoer
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          Klik på en kommando eller brug voice control
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => executeVoiceCommand(action.command)}
              className={`
                group p-4 rounded-lg border border-neutral-700
                hover:border-brand/50 hover:bg-brand/5 transition-all duration-200
                text-left
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <h3 className="font-medium text-neutral-200 group-hover:text-brand transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    "{action.command}"
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Categorized Commands */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Management */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
          <h3 className="text-md font-semibold text-neutral-200 mb-3 flex items-center">
            📋 Lead Management
          </h3>
          <div className="space-y-2">
            {leadCommands.slice(0, 4).map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => executeVoiceCommand(cmd.danishPhrase)}
                className="w-full text-left p-2 rounded hover:bg-neutral-700 transition-colors"
              >
                <div className="text-sm text-neutral-300">{cmd.danishPhrase}</div>
                <div className="text-xs text-neutral-500">{cmd.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
          <h3 className="text-md font-semibold text-neutral-200 mb-3 flex items-center">
            ✅ Compliance
          </h3>
          <div className="space-y-2">
            {complianceCommands.slice(0, 4).map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => executeVoiceCommand(cmd.danishPhrase)}
                className="w-full text-left p-2 rounded hover:bg-neutral-700 transition-colors"
              >
                <div className="text-sm text-neutral-300">{cmd.danishPhrase}</div>
                <div className="text-xs text-neutral-500">{cmd.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Backup & System */}
        <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
          <h3 className="text-md font-semibold text-neutral-200 mb-3 flex items-center">
            💾 Backup & System
          </h3>
          <div className="space-y-2">
            {backupCommands.slice(0, 4).map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => executeVoiceCommand(cmd.danishPhrase)}
                className="w-full text-left p-2 rounded hover:bg-neutral-700 transition-colors"
              >
                <div className="text-sm text-neutral-300">{cmd.danishPhrase}</div>
                <div className="text-xs text-neutral-500">{cmd.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Tips */}
      <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-4">
        <h3 className="text-md font-semibold text-neutral-200 mb-2 flex items-center">
          💡 Voice Tips
        </h3>
        <div className="text-sm text-neutral-400 space-y-1">
          <p>• Tal tydeligt og i normal hastighed</p>
          <p>• Brug danske kommandoer for bedste resultat</p>
          <p>• Du kan sige "hjælp" for at se alle kommandoer</p>
          <p>• Voice agenten husker kontekst mellem kommandoer</p>
        </div>
      </div>
    </div>
  );
};
