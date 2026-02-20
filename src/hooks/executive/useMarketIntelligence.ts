import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AirDNAData, STRData, IntegrationSettings } from '@/types/executive';

async function fetchAirDNAData(apiKey?: string): Promise<AirDNAData> {
  if (!isSupabaseConfigured()) {
    return { destinations: [], isDemo: true, updatedAt: new Date().toISOString() };
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-airdna-data', {
      body: apiKey ? { api_key: apiKey } : {},
    });

    if (error) throw error;
    return data?.data || { destinations: [], isDemo: true, updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error('Failed to fetch AirDNA data:', err);
    return { destinations: [], isDemo: true, updatedAt: new Date().toISOString() };
  }
}

async function fetchSTRData(apiKey?: string): Promise<STRData> {
  if (!isSupabaseConfigured()) {
    return { metrics: [], isDemo: true, updatedAt: new Date().toISOString() };
  }

  try {
    const { data, error } = await supabase.functions.invoke('fetch-str-data', {
      body: apiKey ? { api_key: apiKey } : {},
    });

    if (error) throw error;
    return data?.data || { metrics: [], isDemo: true, updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error('Failed to fetch STR data:', err);
    return { metrics: [], isDemo: true, updatedAt: new Date().toISOString() };
  }
}

async function fetchIntegrationSettings(): Promise<IntegrationSettings> {
  if (!isSupabaseConfigured()) {
    return { newsapiKey: '', airdnaApiKey: '', strApiKey: '', refreshInterval: 30 };
  }

  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'executive_dashboard_newsapi_key',
      'executive_dashboard_airdna_api_key',
      'executive_dashboard_str_api_key',
      'executive_dashboard_refresh_interval',
    ]);

  if (error) throw error;

  const settings: Record<string, string> = {};
  (data || []).forEach((row: { setting_key: string; setting_value: string }) => {
    settings[row.setting_key] = row.setting_value;
  });

  return {
    newsapiKey: settings['executive_dashboard_newsapi_key'] || '',
    airdnaApiKey: settings['executive_dashboard_airdna_api_key'] || '',
    strApiKey: settings['executive_dashboard_str_api_key'] || '',
    refreshInterval: parseInt(settings['executive_dashboard_refresh_interval'] || '30', 10),
  };
}

export function useAirDNAData(apiKey?: string) {
  return useQuery({
    queryKey: ['executive', 'airdna', apiKey || 'demo'],
    queryFn: () => fetchAirDNAData(apiKey),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useSTRData(apiKey?: string) {
  return useQuery({
    queryKey: ['executive', 'str', apiKey || 'demo'],
    queryFn: () => fetchSTRData(apiKey),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useIntegrationSettings() {
  return useQuery({
    queryKey: ['executive', 'integration-settings'],
    queryFn: fetchIntegrationSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveIntegrationSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executive', 'integration-settings'] });
      queryClient.invalidateQueries({ queryKey: ['executive', 'airdna'] });
      queryClient.invalidateQueries({ queryKey: ['executive', 'str'] });
    },
  });
}
