'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/hooks/useToast';
import { Sun, Moon, Monitor } from 'lucide-react';

export function UIPreferences() {
  const { toast } = useToast();
  const { settings, updateSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState({
    theme: settings.theme || 'system',
    compactMode: settings.compactMode ?? false,
    showTimestamps: settings.showTimestamps ?? true,
    enableSoundEffects: settings.enableSoundEffects ?? false,
    enableNotifications: settings.enableNotifications ?? true,
    fontSize: settings.fontSize || 'medium',
  });

  const themes = [
    { id: 'light', name: 'Light', icon: Sun },
    { id: 'dark', name: 'Dark', icon: Moon },
    { id: 'system', name: 'System', icon: Monitor },
  ];

  const fontSizes = [
    { id: 'small', name: 'Small', example: 'text-sm' },
    { id: 'medium', name: 'Medium', example: 'text-base' },
    { id: 'large', name: 'Large', example: 'text-lg' },
  ];

  const handleSave = () => {
    updateSettings(localSettings);

    // Apply theme
    if (localSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (localSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    toast({
      title: 'Settings saved',
      description: 'UI preferences have been updated successfully',
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">UI Preferences</h2>
      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() =>
                  setLocalSettings((prev) => ({ ...prev, theme: theme.id }))
                }
                className={`p-4 border-2 rounded-lg transition-colors ${
                  localSettings.theme === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <theme.icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{theme.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label>Font Size</Label>
          <div className="grid grid-cols-3 gap-3">
            {fontSizes.map((size) => (
              <button
                key={size.id}
                onClick={() =>
                  setLocalSettings((prev) => ({ ...prev, fontSize: size.id }))
                }
                className={`p-4 border-2 rounded-lg transition-colors ${
                  localSettings.fontSize === size.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className={`${size.example} font-medium mb-1`}>Aa</p>
                <p className="text-xs">{size.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding throughout the interface
              </p>
            </div>
            <Switch
              checked={localSettings.compactMode}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, compactMode: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Show Timestamps</Label>
              <p className="text-sm text-muted-foreground">
                Display time information on messages
              </p>
            </div>
            <Switch
              checked={localSettings.showTimestamps}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({ ...prev, showTimestamps: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for notifications and actions
              </p>
            </div>
            <Switch
              checked={localSettings.enableSoundEffects}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  enableSoundEffects: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new messages and updates
              </p>
            </div>
            <Switch
              checked={localSettings.enableNotifications}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) => ({
                  ...prev,
                  enableNotifications: checked,
                }))
              }
            />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Card>
  );
}
