'use client';

import React from 'react';
import { useVoiceStore } from '@/store/voice-store';
import { ConversationTurn } from '@tekup/shared';

export const ConversationView: React.FC = () => {
  const { conversation } = useVoiceStore();

  // Simuler conversation data for demo – use fixed timestamps to avoid SSR/client drift
  const demoConversation: ConversationTurn[] = [
    {
      id: '1',
      type: 'assistant',
      content: 'Hej! Jeg er din TekUp Voice Agent. Hvad kan jeg hjælpe dig med i dag?',
      timestamp: '2025-01-01T12:00:00.000Z',
      tenant: 'tekup'
    },
    {
      id: '2',
      type: 'user',
      content: 'Vis alle leads',
      timestamp: '2025-01-01T12:01:00.000Z',
      tenant: 'tekup'
    },
    {
      id: '3',
      type: 'assistant',
      content: 'Jeg henter alle leads for TekUp tenant. Du har i øjeblikket 24 leads med følgende status: 8 nye, 12 kontaktede, 3 kvalificerede og 1 konverteret.',
      timestamp: '2025-01-01T12:02:00.000Z',
      tenant: 'tekup'
    },
    {
      id: '4',
      type: 'user',
      content: 'Start backup',
      timestamp: '2025-01-01T12:03:00.000Z',
      tenant: 'tekup'
    },
    {
      id: '5',
      type: 'assistant',
      content: 'Jeg starter backup processen for TekUp tenant. Backup job #BK-2024-001 er startet med høj prioritet. Du vil modtage notifikation når backup er færdig.',
      timestamp: '2025-01-01T12:04:00.000Z',
      tenant: 'tekup'
    }
  ];

  const displayConversation = conversation.length > 0 ? conversation : demoConversation;

  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-700">
      {/* Header */}
      <div className="border-b border-neutral-700 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-200">
          🎙️ Voice Samtale
        </h2>
        <p className="text-sm text-neutral-400">
          Real-time kommunikation med din AI assistent
        </p>
      </div>

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto p-6 space-y-4">
        {displayConversation.map((turn) => (
          <div
            key={turn.id}
            className={`flex ${turn.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-xs lg:max-w-md px-4 py-3 rounded-lg
              ${turn.type === 'user'
                ? 'bg-brand text-white'
                : 'bg-neutral-700 text-neutral-200 border border-neutral-600'
              }
            `}>
              {/* Message Header */}
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm">
                  {turn.type === 'user' ? '👤 Du' : '🤖 AI Assistent'}
                </span>
                <span className="text-xs opacity-70" suppressHydrationWarning>
                  {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString('da-DK') : ''}
                </span>
              </div>

              {/* Message Content */}
              <p className="text-sm">{turn.content}</p>

              {/* Audio Player for AI responses */}
              {turn.type === 'assistant' && turn.audio && (
                <div className="mt-3">
                  <audio
                    controls
                    className="w-full h-10"
                    src={turn.audio}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {displayConversation.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎙️</div>
            <p className="text-neutral-400">Ingen samtale endnu</p>
            <p className="text-sm text-neutral-500">Start med at tale til din voice agent</p>
          </div>
        )}
      </div>

      {/* Conversation Stats */}
      <div className="border-t border-neutral-700 px-6 py-3 bg-neutral-750">
        <div className="flex justify-between text-sm text-neutral-400">
          <span>{displayConversation.length} beskeder</span>
          <span>Tenant: {displayConversation[0]?.tenant || 'ukendt'}</span>
        </div>
      </div>
    </div>
  );
};
