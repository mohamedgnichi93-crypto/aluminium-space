import { supabase } from '../lib/supabase';

export interface FaqEntry {
  id: string;
  question_fr: string;
  question_ar: string | null;
  question_tn: string | null;
  question_en: string | null;
  question_it: string | null;
  answer_fr: string;
  answer_ar: string | null;
  answer_tn: string | null;
  answer_en: string | null;
  answer_it: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: FaqEntry[] = [];
let cacheTime = 0;
let fetchPromise: Promise<FaqEntry[]> | null = null;

async function fetchFaq(): Promise<FaqEntry[]> {
  try {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch FAQ:', error);
      return cache;
    }

    cache = (data || []) as FaqEntry[];
    cacheTime = Date.now();
    return cache;
  } catch (err) {
    console.error('FAQ fetch error:', err);
    return cache;
  } finally {
    fetchPromise = null;
  }
}

/** Returns cached FAQ entries or fetches from Supabase. 5-min cache. */
export async function getFaq(): Promise<FaqEntry[]> {
  if (cache.length > 0 && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchFaq();
  return fetchPromise;
}

/** Force refresh FAQ from Supabase. */
export async function refreshFaq(): Promise<FaqEntry[]> {
  cacheTime = 0;
  fetchPromise = null;
  return fetchFaq();
}

/** Get all FAQ entries including inactive (for dashboard). */
export async function getAllFaq(): Promise<FaqEntry[]> {
  const { data, error } = await supabase
    .from('faq')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch all FAQ:', error);
    return [];
  }
  return (data || []) as FaqEntry[];
}

/** Create a new FAQ entry. */
export async function createFaq(entry: Omit<FaqEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase
    .from('faq')
    .insert(entry);

  if (error) throw error;
  cacheTime = 0;
}

/** Update a FAQ entry. */
export async function updateFaq(id: string, patch: Partial<FaqEntry>): Promise<void> {
  const { error } = await supabase
    .from('faq')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  cacheTime = 0;
}

/** Delete a FAQ entry. */
export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase
    .from('faq')
    .delete()
    .eq('id', id);

  if (error) throw error;
  cacheTime = 0;
}

// ── Realtime: auto-invalidate cache on any FAQ change ──
supabase
  .channel('faq-realtime')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'faq' },
    () => { cacheTime = 0; }
  )
  .subscribe();
