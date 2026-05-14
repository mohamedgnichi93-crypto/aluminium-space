import { formatPrice as formatPriceUtil } from './formatPrice';
import { priceTables } from '../data/products';

export interface PriceCalculationParams {
  productId: string;
  width: number;
  height: number;
  meshType?: 'fibre' | 'aluminium' | 'inox';
  color?: string;
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

export function getColorSurchargePct(color?: string): number {
  if (!color || color === 'Blanc') return 0;
  if (color === 'Noir') return COLOR_SURCHARGE.NOIR_PCT;
  return COLOR_SURCHARGE.EXTENDED_PCT; // any other = extended
}

// Returns price object in millimes
export const calculatePrice = ({ productId, width, height, meshType, color }: PriceCalculationParams): PriceResult | null => {
  if (!width || !height) return null;

  let basePrice: number | null = null;

  switch (productId) {
    case 'colibri-50': {
      if (height > 250) break;

      if (height <= 170) {
        if (width > 200) break;
        const table = {
          60: 263, 70: 283, 80: 296, 90: 313, 100: 327, 110: 341, 120: 357,
          130: 373, 140: 388, 150: 402, 160: 418, 170: 434, 180: 449, 190: 465, 200: 480
        };
        const minWidth = 60;
        const effectiveWidth = width <= minWidth ? minWidth : Math.min(Math.ceil(width / 10) * 10, 200);
        basePrice = (table[effectiveWidth as keyof typeof table] ?? null) * 1000;
      } else {
        if (width > 160) break;
        const table = {
          80: 357, 90: 373, 100: 388, 110: 402, 120: 418, 130: 434, 140: 449, 150: 465, 160: 480
        };
        const minWidth = 80;
        const effectiveWidth = width <= minWidth ? minWidth : Math.min(Math.ceil(width / 10) * 10, 160);
        basePrice = (table[effectiveWidth as keyof typeof table] ?? null) * 1000;
      }
      break;
    }
    case 'sidney-50': {
      if (width > 200 || height > 260) break;
      const sidneyTable1 = { 220: 611, 230: 627, 240: 651, 250: 667, 260: 682 };
      const sidneyTable2 = { 220: 651, 230: 667, 240: 682, 250: 697, 260: 712 };
      const table = width <= 160 ? sidneyTable1 : sidneyTable2;
      const effectiveHeight = height <= 220 ? 220 : Math.min(Math.ceil(height / 10) * 10, 260);
      basePrice = (table[effectiveHeight as keyof typeof table] ?? null) * 1000;
      break;
    }
    case 'sidney-50-ac': {
      if (width > 400 || height > 260) break;
      const sidneyACTable1 = { 220: 1224, 230: 1252, 240: 1284, 250: 1314, 260: 1344 };
      const sidneyACTable2 = { 220: 1252, 230: 1284, 240: 1314, 250: 1344, 260: 1375 };
      const table = width <= 320 ? sidneyACTable1 : sidneyACTable2;
      const effectiveHeight = height <= 220 ? 220 : Math.min(Math.ceil(height / 10) * 10, 260);
      basePrice = (table[effectiveHeight as keyof typeof table] ?? null) * 1000;
      break;
    }
    case 'elba': {
      if (width > 120 || height > 250) break;
      const areaCm = (width / 100) * (height / 100);
      const billableM2 = Math.ceil(areaCm);
      const finalM2 = Math.max(1, billableM2);
      basePrice = finalM2 * 326 * 1000;
      break;
    }
    case 'plisse31': {
      if (width > 500 || height > 300) break;
      
      const widths = [125, 180, 250, 300, 400, 500];
      const targetWidth = widths.find(w => width <= w);
      if (!targetWidth) break;

      const hRange: '120-180' | '180-240' | '240-300' = 
        height <= 180 ? '120-180' : 
        height <= 240 ? '180-240' : 
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
