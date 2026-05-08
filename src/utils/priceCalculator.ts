export interface PriceCalculationParams {
  productId: string;
  width: number;
  height: number;
  meshType?: 'fibre' | 'aluminium' | 'inox';
}


// Returns price in DT (millimes not used anymore since we multiply directly and format later)
// Wait, the previous format used * 1000 for millimes? The user gave integer DT prices (102, 108...). 
// In the current file formatPrice divides by 1000. So we should return DT * 1000.
export const calculatePrice = ({ productId, width, height, meshType }: PriceCalculationParams): number | null => {
  if (!width || !height) return null;

  switch (productId) {
    case 'colibri-50': {
      // Validate max dimensions only
      if (height > 250) return null;
      
      if (height <= 170) {
        if (width > 200) return null;
        const table = {
          60: 263, 70: 283, 80: 296, 90: 313, 100: 327, 110: 341, 120: 357,
          130: 373, 140: 388, 150: 402, 160: 418, 170: 434, 180: 449, 190: 465, 200: 480
        };
        const minWidth = 60;
        const effectiveWidth = width <= minWidth ? minWidth : Math.min(Math.ceil(width / 10) * 10, 200);
        return (table[effectiveWidth as keyof typeof table] ?? null) * 1000;
      } else {
        if (width > 160) return null;
        const table = {
          80: 357, 90: 373, 100: 388, 110: 402, 120: 418, 130: 434, 140: 449, 150: 465, 160: 480
        };
        const minWidth = 80;
        const effectiveWidth = width <= minWidth ? minWidth : Math.min(Math.ceil(width / 10) * 10, 160);
        return (table[effectiveWidth as keyof typeof table] ?? null) * 1000;
      }
    }
    case 'sidney-50': {
      // Validate max dimensions (show error if TOO BIG)
      if (width > 200 || height > 260) return null;
      
      const sidneyTable1 = { 220: 611, 230: 627, 240: 651, 250: 667, 260: 682 };
      const sidneyTable2 = { 220: 651, 230: 667, 240: 682, 250: 697, 260: 712 };
      
      // Select correct table based on WIDTH
      const table = width <= 160 ? sidneyTable1 : sidneyTable2;
      
      // CEILING rounding for height to nearest 10
      // If height below minimum (220) → use minimum price (220)
      const effectiveHeight = height <= 220 ? 220 : Math.min(Math.ceil(height / 10) * 10, 260);
      
      return (table[effectiveHeight as keyof typeof table] ?? null) * 1000;
    }
    case 'sidney-50-ac': {
      // Validate max dimensions (show error if TOO BIG)
      if (width > 400 || height > 260) return null;
      
      const sidneyACTable1 = { 220: 1224, 230: 1252, 240: 1284, 250: 1314, 260: 1344 };
      const sidneyACTable2 = { 220: 1252, 230: 1284, 240: 1314, 250: 1344, 260: 1375 };
      
      // Select correct table based on WIDTH
      const table = width <= 320 ? sidneyACTable1 : sidneyACTable2;
      
      // CEILING rounding for height to nearest 10
      // If height below minimum (220) → use minimum price (220)
      const effectiveHeight = height <= 220 ? 220 : Math.min(Math.ceil(height / 10) * 10, 260);
      
      return (table[effectiveHeight as keyof typeof table] ?? null) * 1000;
    }
    case 'elba': {
      if (width > 120 || height > 250) return null;
      const wM = width / 100;
      const hM = height / 100;
      const area = Math.max(1, wM * hM); // Clamped to 1 m²
      const rates = { fibre: 143, aluminium: 183, inox: 262 };
      const rate = rates[meshType || 'fibre'] || 143;
      return (area * rate) * 1000;
    }
    default:
      return null;
  }
};

export const formatPrice = (priceInMillimes: number): string => {
  return (priceInMillimes / 1000).toFixed(3);
};
