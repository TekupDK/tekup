'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/hooks/useToast';

export function ModelSettings() {
  const { toast } = useToast();
  const { settings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState({
    model: settings.model || 'claude-3-5-sonnet-20241022',
    temperature: settings.temperature || 0.7,
    maxTokens: settings.maxTokens || 4096,
    topP: settings.topP || 0.9,
  });

  const models = [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most capable, best for complex tasks' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Powerful model for demanding tasks' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance and speed' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast and efficient' },
  ];

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: 'Settings saved',
      description: 'Model settings have been updated successfully',
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Model Configuration</h2>
      <div className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label>AI Model</Label>
          <select
            value={localSettings.model}
            onChange={(e) =>
              setLocalSettings((prev) => ({ ...prev, model: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded-md bg-background"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {models.find((m) => m.id === localSettings.model)?.description}
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">
              {localSettings.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[localSettings.temperature]}
            onValueChange={([value]) =>
              setLocalSettings((prev) => ({ ...prev, temperature: value }))
            }
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Lower values make output more focused and deterministic, higher values make it more creative
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Max Tokens</Label>
            <span className="text-sm text-muted-foreground">
              {localSettings.maxTokens}
            </span>
          </div>
          <Slider
            value={[localSettings.maxTokens]}
            onValueChange={([value]) =>
              setLocalSettings((prev) => ({ ...prev, maxTokens: value }))
            }
            min={256}
            max={8192}
            step={256}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of the AI's response
          </p>
        </div>

        {/* Top P */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Top P (Nucleus Sampling)</Label>
            <span className="text-sm text-muted-foreground">
              {localSettings.topP.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[localSettings.topP]}
            onValueChange={([value]) =>
              setLocalSettings((prev) => ({ ...prev, topP: value }))
            }
            min={0}
            max={1}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Controls diversity of generated text. Lower values make output more focused.
          </p>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}
