/**
 * Formats a price in DT with 3 decimal places and 'DT' unit.
 * Example: 1.234 -> "1,234 DT"
 */
export const formatPriceDT = (price: number): string => {
  return price.toFixed(3).replace('.', ',') + ' DT';
};

/**
 * Formats a price in DT with 3 decimal places without unit.
 * Example: 1.234 -> "1,234"
 */
export const formatPrice = (price: number): string => {
  return price.toFixed(3).replace('.', ',');
};
