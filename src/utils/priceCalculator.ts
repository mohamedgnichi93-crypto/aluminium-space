import { formatPrice as formatPriceUtil } from './formatPrice';
import { priceTables, type Product } from '../data/products';

export interface PriceCalculationParams {
  productId: string;
  width: number;
  height: number;
  meshType?: 'fibre' | 'aluminium' | 'inox';
  color?: string;
  dimensionLimits?: Partial<ProductDimensionLimits>;
  basePrice?: number | null;
  pricePerM2?: boolean | null;
}

export interface PriceResult {
  baseUnitPrice: number;
  colorSurchargeAmount: number;
  colorSurchargePct: number;
  unitPrice: number;
}

// Color surcharge rates
export const COLOR_SURCHARGE = {
  NOIR_PCT: 10,
  EXTENDED_PCT: 15,
  STANDARD_PCT: 0,
} as const;

export interface ProductDimensionLimits {
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
  maxArea?: number;
}

export function getProductDimensionLimits(productId: string, height = 0): ProductDimensionLimits | null {
  switch (productId) {
    case 'colibri-50':
      return height > 170
        ? { minW: 80, maxW: 160, minH: 60, maxH: 250 }
        : { minW: 60, maxW: 200, minH: 60, maxH: 250 };
    case 'sidney-50':
      return { minW: 60, maxW: 200, minH: 150, maxH: 260 };
    case 'sidney-50-ac':
      return { minW: 100, maxW: 400, minH: 150, maxH: 260 };
    case 'elba':
      return { minW: 40, maxW: 600, minH: 40, maxH: 600, maxArea: 21 };
    case 'plisse31':
      return { minW: 125, maxW: 500, minH: 120, maxH: 300 };
    default:
      return null;
  }
}

function positiveOrFallback(value: number | undefined | null, fallback: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function resolveProductDimensionLimits(
  productId: string,
  height = 0,
  overrides?: Partial<ProductDimensionLimits>,
): ProductDimensionLimits | null {
  const fallback = getProductDimensionLimits(productId, height);
  if (!overrides) return fallback;

  const minW = positiveOrFallback(overrides.minW, fallback?.minW);
  const maxW = positiveOrFallback(overrides.maxW, fallback?.maxW);
  const minH = positiveOrFallback(overrides.minH, fallback?.minH);
  const maxH = positiveOrFallback(overrides.maxH, fallback?.maxH);

  if (!minW || !maxW || !minH || !maxH) return fallback;

  return {
    minW,
    maxW,
    minH,
    maxH,
    maxArea: positiveOrFallback(overrides.maxArea, fallback?.maxArea),
  };
}

export function getProductPricingOverrides(product?: Product | null): Partial<PriceCalculationParams> {
  if (!product) return {};
  return {
    dimensionLimits: {
      minW: product.minW,
      maxW: product.maxW,
      minH: product.minH,
      maxH: product.maxH,
      maxArea: product.maxArea,
    },
    basePrice: product.basePrice,
    pricePerM2: product.pricePerM2,
  };
}

export function isWithinProductDimensions(
  productId: string,
  width: number,
  height: number,
  dimensionLimits?: Partial<ProductDimensionLimits>,
): boolean {
  const limits = resolveProductDimensionLimits(productId, height, dimensionLimits);
  if (!limits || width <= 0 || height <= 0) return false;

  const w = Math.max(width, limits.minW);
  const h = Math.max(height, limits.minH);
  const areaM2 = (w * h) / 10000;

  return Boolean(
    w <= limits.maxW &&
    h <= limits.maxH &&
    (!limits.maxArea || areaM2 <= limits.maxArea)
  );
}

export function getColorSurchargePct(color?: string): number {
  if (!color || color === 'Blanc') return 0;
  if (color === 'Noir') return COLOR_SURCHARGE.NOIR_PCT;
  return COLOR_SURCHARGE.EXTENDED_PCT; // any other = extended
}

function normalizeMillimes(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return value < 10000 ? value * 1000 : value;
}

// Returns price object in millimes
export const calculatePrice = ({
  productId,
  width,
  height,
  color,
  dimensionLimits,
  basePrice: productBasePrice,
  pricePerM2,
}: PriceCalculationParams): PriceResult | null => {
  if (!width || !height) return null;
  if (!isWithinProductDimensions(productId, width, height, dimensionLimits)) return null;

  const limits = resolveProductDimensionLimits(productId, height, dimensionLimits);
  if (!limits) return null;

  const w = Math.max(width, limits.minW);
  const h = Math.max(height, limits.minH);

  if (limits.maxArea && (w * h) / 10000 > limits.maxArea) {
    return null;
  }

  let basePrice: number | null = null;

  switch (productId) {
    case 'colibri-50': {
      if (h > 250) break;

      if (h <= 170) {
        if (w > 200) break;
        const table = {
          60: 263, 70: 283, 80: 296, 90: 313, 100: 327, 110: 341, 120: 357,
          130: 373, 140: 388, 150: 402, 160: 418, 170: 434, 180: 449, 190: 465, 200: 480
        };
        const minWidth = 60;
        const effectiveWidth = w <= minWidth ? minWidth : Math.min(Math.ceil(w / 10) * 10, 200);
        basePrice = (table[effectiveWidth as keyof typeof table] ?? null) * 1000;
      } else {
        if (w > 160) break;
        const table = {
          80: 357, 90: 373, 100: 388, 110: 402, 120: 418, 130: 434, 140: 449, 150: 465, 160: 480
        };
        const minWidth = 80;
        const effectiveWidth = w <= minWidth ? minWidth : Math.min(Math.ceil(w / 10) * 10, 160);
        basePrice = (table[effectiveWidth as keyof typeof table] ?? null) * 1000;
      }
      break;
    }
    case 'sidney-50': {
      if (w > 200 || h > 260) break;
      const sidneyTable1 = { 220: 611, 230: 627, 240: 651, 250: 667, 260: 682 };
      const sidneyTable2 = { 220: 651, 230: 667, 240: 682, 250: 697, 260: 712 };
      const table = w <= 160 ? sidneyTable1 : sidneyTable2;
      const effectiveHeight = h <= 220 ? 220 : Math.min(Math.ceil(h / 10) * 10, 260);
      basePrice = (table[effectiveHeight as keyof typeof table] ?? null) * 1000;
      break;
    }
    case 'sidney-50-ac': {
      if (w > 400 || h > 260) break;
      const sidneyACTable1 = { 220: 1224, 230: 1252, 240: 1284, 250: 1314, 260: 1344 };
      const sidneyACTable2 = { 220: 1252, 230: 1284, 240: 1314, 250: 1344, 260: 1375 };
      const table = w <= 320 ? sidneyACTable1 : sidneyACTable2;
      const effectiveHeight = h <= 220 ? 220 : Math.min(Math.ceil(h / 10) * 10, 260);
      basePrice = (table[effectiveHeight as keyof typeof table] ?? null) * 1000;
      break;
    }
    case 'elba': {
      const areaCm = (w / 100) * (h / 100);
      const billableM2 = Math.ceil(areaCm);
      const finalM2 = Math.max(1, billableM2);
      const perM2Price = pricePerM2 ? normalizeMillimes(productBasePrice) : null;
      basePrice = finalM2 * (perM2Price ?? 326000);
      break;
    }
    case 'plisse31': {
      if (w > 500 || h > 300) break;

      const widths = [125, 180, 250, 300, 400, 500];
      const targetWidth = widths.find(x => w <= x);
      if (!targetWidth) break;

      const hRange: '120-180' | '180-240' | '240-300' =
        h <= 180 ? '120-180' :
        h <= 240 ? '180-240' :
        '240-300';

      const table = priceTables.plisse31 as Record<number, Record<'120-180' | '180-240' | '240-300', number>>;
      const price = table[targetWidth]?.[hRange];
      if (price !== undefined) {
        basePrice = price;
      }
      break;
    }
  }

  if (basePrice === null) return null;

  // Apply color surcharge
  const surchargePct = getColorSurchargePct(color);
  const surchargeAmount = Math.round(basePrice * surchargePct / 100);
  const finalPrice = basePrice + surchargeAmount;

  return {
    baseUnitPrice: basePrice,
    colorSurchargeAmount: surchargeAmount,
    colorSurchargePct: surchargePct,
    unitPrice: finalPrice,
  };
};

export const formatPrice = (priceInMillimes: number): string => {
  return formatPriceUtil(priceInMillimes / 1000);
};
