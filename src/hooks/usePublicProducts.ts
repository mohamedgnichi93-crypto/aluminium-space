import { useEffect, useState } from 'react';
import { products as staticProducts, type Product } from '../data/products';
import { getPublicProductCatalog } from '../store/productsStore';

type ProductSource = 'supabase' | 'fallback';

interface PublicProductsState {
  products: Product[];
  source: ProductSource;
  isLoading: boolean;
}

export function usePublicProducts(): PublicProductsState {
  const [state, setState] = useState<PublicProductsState>({
    products: staticProducts,
    source: 'fallback',
    isLoading: true,
  });

  useEffect(() => {
    let alive = true;

    queueMicrotask(() => {
      void getPublicProductCatalog()
        .then((catalog) => {
          if (!alive) return;
          setState({
            products: catalog.products,
            source: catalog.source,
            isLoading: false,
          });
        })
        .catch((error) => {
          console.error('Public products fallback active:', error);
          if (!alive) return;
          setState({
            products: staticProducts,
            source: 'fallback',
            isLoading: false,
          });
        });
    });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
