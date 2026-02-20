import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIntegrationSettings, useSaveIntegrationSetting } from '@/hooks/executive';
import { useToast } from '@/hooks/use-toast';

interface IntegrationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationSettings({ open, onOpenChange }: IntegrationSettingsProps) {
  const { data: settings } = useIntegrationSettings();
  const saveSetting = useSaveIntegrationSetting();
  const { toast } = useToast();

  const [airdnaKey, setAirdnaKey] = useState('');
  const [strKey, setStrKey] = useState('');

  useEffect(() => {
    if (settings) {
      setAirdnaKey(settings.airdnaApiKey);
      setStrKey(settings.strApiKey);
    }
  }, [settings]);

  const handleSave = async (key: string, value: string, label: string) => {
    try {
      saveSetting.mutate(
        { key, value },
        {
          onSuccess: () => {
            toast({
              title: `${label} key saved`,
              description: value ? 'API key connected successfully.' : 'API key removed.',
            });
          },
          onError: () => {
            toast({
              title: 'Failed to save',
              description: 'Could not save the API key. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } catch {
      // handled by onError
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-900 border-slate-700 text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Integration Settings</SheetTitle>
          <SheetDescription className="text-slate-400">
            Connect third-party data sources to replace demo data with live feeds.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* AirDNA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">AirDNA API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter AirDNA API key"
                value={airdnaKey}
                onChange={(e) => setAirdnaKey(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
              <Button
                size="sm"
                onClick={() => handleSave('executive_dashboard_airdna_api_key', airdnaKey, 'AirDNA')}
                disabled={saveSetting.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">Enables live market comparison data (BYOK model).</p>
          </div>

          {/* STR Global */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">STR Global API Key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter STR Global API key"
                value={strKey}
                onChange={(e) => setStrKey(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
              <Button
                size="sm"
                onClick={() => handleSave('executive_dashboard_str_api_key', strKey, 'STR Global')}
                disabled={saveSetting.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">Enables hotel benchmark comparison data (BYOK model).</p>
          </div>

          {/* NewsAPI Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">NewsAPI</label>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${settings?.newsapiKey ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="text-xs text-slate-400">
                {settings?.newsapiKey ? 'Connected (server-side)' : 'Using demo feed (set via Supabase secrets)'}
              </span>
            </div>
          </div>

          {/* Refresh Interval */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Auto-Refresh Interval</label>
            <select
              className="w-full rounded-md border border-slate-600 bg-slate-800 text-white px-3 py-2 text-sm"
              value={settings?.refreshInterval || 30}
              onChange={(e) => handleSave('executive_dashboard_refresh_interval', e.target.value, 'Refresh interval')}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="0">Disabled</option>
            </select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
