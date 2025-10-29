'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/hooks/useToast';

export function MemorySettings() {
  const { toast } = useToast();
  const { settings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState({
    enableMemory: settings.enableMemory ?? true,
    enableAutoMemory: settings.enableAutoMemory ?? true,
    memoryRetention: settings.memoryRetention || 30,
    maxMemorySize: settings.maxMemorySize || 1000,
  });

  const handleSave = () => {
    updateSettings(localSettings);
    toast({
      title: 'Settings saved',
      description: 'Memory settings have been updated successfully',
    });
  };

  const handleClearMemories = () => {
    if (confirm('Are you sure you want to clear all memories? This action cannot be undone.')) {
      toast({
        title: 'Memories cleared',
        description: 'All memories have been permanently deleted',
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Memory Configuration</h2>
      <div className="space-y-6">
        {/* Enable Memory */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label>Enable Memory System</Label>
            <p className="text-sm text-muted-foreground">
              Allow the AI to remember context across conversations
            </p>
          </div>
          <Switch
            checked={localSettings.enableMemory}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, enableMemory: checked }))
            }
          />
        </div>

        {/* Auto Memory */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label>Automatic Memory Creation</Label>
            <p className="text-sm text-muted-foreground">
              Automatically extract and save important information from conversations
            </p>
          </div>
          <Switch
            checked={localSettings.enableAutoMemory}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, enableAutoMemory: checked }))
            }
            disabled={!localSettings.enableMemory}
          />
        </div>

        {/* Memory Retention */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Memory Retention Period (Days)</Label>
            <span className="text-sm text-muted-foreground">
              {localSettings.memoryRetention === 365 ? 'Forever' : `${localSettings.memoryRetention} days`}
            </span>
          </div>
          <Slider
            value={[localSettings.memoryRetention]}
            onValueChange={([value]) =>
              setLocalSettings((prev) => ({ ...prev, memoryRetention: value }))
            }
            min={7}
            max={365}
            step={1}
            className="w-full"
            disabled={!localSettings.enableMemory}
          />
          <p className="text-xs text-muted-foreground">
            Automatically delete memories older than this period
          </p>
        </div>

        {/* Max Memory Size */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Maximum Memory Items</Label>
            <span className="text-sm text-muted-foreground">
              {localSettings.maxMemorySize}
            </span>
          </div>
          <Slider
            value={[localSettings.maxMemorySize]}
            onValueChange={([value]) =>
              setLocalSettings((prev) => ({ ...prev, maxMemorySize: value }))
            }
            min={100}
            max={10000}
            step={100}
            className="w-full"
            disabled={!localSettings.enableMemory}
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of memory items to store
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button
            variant="destructive"
            onClick={handleClearMemories}
            disabled={!localSettings.enableMemory}
          >
            Clear All Memories
          </Button>
        </div>

        {/* Warning */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            <strong>Note:</strong> Disabling memory will prevent the AI from accessing
            previously saved context, but existing memories will be preserved.
          </p>
        </div>
      </div>
    </Card>
  );
}
