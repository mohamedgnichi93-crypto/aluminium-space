import { supabase } from '../lib/supabase';

export interface SupabaseProduct {
  id: string;
  slug: string;
  name: string;
  type: string;
  category_fr: string | null;
  category_ar: string | null;
  description_fr: string | null;
  description_ar: string | null;
  description_tn: string | null;
  description_en: string | null;
  description_it: string | null;
  features: string[];
  caisson: string | null;
  taille_effective: string | null;
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  base_price: number;
  price_per_m2: boolean;
  price_tables: Record<string, any>;
  colors: string[];
  image_url: string | null;
  path: string | null;
  is_bestseller: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache: SupabaseProduct[] = [];
let cacheTime = 0;
let fetchPromise: Promise<SupabaseProduct[]> | null = null;

async function fetchProducts(): Promise<SupabaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products:', error);
      return cache;
    }

    cache = (data || []) as SupabaseProduct[];
    cacheTime = Date.now();
    return cache;
  } catch (err) {
    console.error('Products fetch error:', err);
    return cache;
  } finally {
    fetchPromise = null;
  }
}

/** Returns cached products or fetches from Supabase. 5-min cache. */
export async function getProducts(): Promise<SupabaseProduct[]> {
  if (cache.length > 0 && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchProducts();
  return fetchPromise;
}

/** Force refresh products from Supabase. */
export async function refreshProducts(): Promise<SupabaseProduct[]> {
  cacheTime = 0;
  fetchPromise = null;
  return fetchProducts();
}

/** Get all products including inactive (for dashboard). */
export async function getAllProducts(): Promise<SupabaseProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch all products:', error);
    return [];
  }
  return (data || []) as SupabaseProduct[];
}

/** Update a product in Supabase. */
export async function updateProduct(id: string, patch: Partial<SupabaseProduct>): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  cacheTime = 0; // invalidate cache
}

// ── Realtime: auto-invalidate cache on any products change ──
supabase
  .channel('products-realtime')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    () => { cacheTime = 0; }
  )
  .subscribe();
