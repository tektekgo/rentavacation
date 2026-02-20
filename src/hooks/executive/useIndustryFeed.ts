import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { NewsItem, MacroIndicator } from '@/types/executive';

async function fetchIndustryNews(): Promise<NewsItem[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.functions.invoke('fetch-industry-news', {
      method: 'POST',
    });

    if (error) throw error;
    return data?.data || [];
  } catch (err) {
    console.error('Failed to fetch industry news:', err);
    return [];
  }
}

async function fetchMacroIndicators(): Promise<MacroIndicator[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.functions.invoke('fetch-macro-indicators', {
      method: 'GET',
    });

    if (error) throw error;
    return data?.data || [];
  } catch (err) {
    console.error('Failed to fetch macro indicators:', err);
    return [];
  }
}

export function useIndustryNews() {
  return useQuery({
    queryKey: ['executive', 'industry-news'],
    queryFn: fetchIndustryNews,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

export function useMacroIndicators() {
  return useQuery({
    queryKey: ['executive', 'macro-indicators'],
    queryFn: fetchMacroIndicators,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
  });
}
