import { supabase } from '../lib/supabase';
import { products as staticProducts, type Product, type ProductCategory } from '../data/products';

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
let lastFetchFailed = false;

const DESCRIPTION_KEYS: Record<string, string> = {
  'colibri-50': 'products.colibri50_desc',
  'sidney-50': 'products.sidney50_desc',
  'sidney-50-ac': 'products.sidney50ac_desc',
  elba: 'products.elba_desc',
  plisse31: 'products.plisse31_desc',
};

const CATEGORY_BY_SLUG: Record<string, ProductCategory> = {
  'colibri-50': 'plisse',
  'sidney-50': 'enroulable',
  'sidney-50-ac': 'plisse',
  elba: 'panneau',
  plisse31: 'plisse',
};

function normalizeImageUrl(imageUrl: string | null | undefined, fallback?: string): string {
  if (!imageUrl) return fallback || '/images/colibri-50.webp';
  if (imageUrl === '/images/elba.webp') return '/images/elba-v2.webp';
  return imageUrl;
}

function categoryFromProduct(product: SupabaseProduct, slug: string, fallback?: Product): ProductCategory {
  if (fallback?.category) return fallback.category;
  if (CATEGORY_BY_SLUG[slug]) return CATEGORY_BY_SLUG[slug];

  const raw = `${product.type || ''} ${product.category_fr || ''}`.toLowerCase();
  if (raw.includes('panneau') || raw.includes('fixe')) return 'panneau';
  if (raw.includes('enroul')) return 'enroulable';
  return 'plisse';
}

export function toPublicProduct(product: SupabaseProduct): Product {
  const slug = product.slug || product.id;
  const fallback = staticProducts.find(item => item.id === slug);

  return {
    id: slug,
    name: product.name || fallback?.name || slug,
    category: categoryFromProduct(product, slug, fallback),
    description: product.description_fr || fallback?.description || '',
    descriptionKey: DESCRIPTION_KEYS[slug] || fallback?.descriptionKey || `products.${slug}_desc`,
    imageUrl: normalizeImageUrl(product.image_url, fallback?.imageUrl),
    minW: product.min_width || fallback?.minW,
    maxW: product.max_width || fallback?.maxW,
    minH: product.min_height || fallback?.minH,
    maxH: product.max_height || fallback?.maxH,
    maxArea: fallback?.maxArea,
    basePrice: product.base_price || fallback?.basePrice,
    pricePerM2: product.price_per_m2 || fallback?.pricePerM2,
  };
}

async function fetchProducts(): Promise<SupabaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch products:', error);
      lastFetchFailed = true;
      return cache;
    }

    cache = (data || []) as SupabaseProduct[];
    cacheTime = Date.now();
    lastFetchFailed = false;
    return cache;
  } catch (err) {
    console.error('Products fetch error:', err);
    lastFetchFailed = true;
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

export async function getPublicProductCatalog(): Promise<{ products: Product[]; source: 'supabase' | 'fallback' }> {
  const remoteProducts = await getProducts();
  if (remoteProducts.length > 0) {
    return { products: remoteProducts.map(toPublicProduct), source: 'supabase' };
  }
  if (lastFetchFailed) {
    return { products: staticProducts, source: 'fallback' };
  }
  return { products: [], source: 'supabase' };
}

export async function getPublicProducts(): Promise<Product[]> {
  const catalog = await getPublicProductCatalog();
  return catalog.products;
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
