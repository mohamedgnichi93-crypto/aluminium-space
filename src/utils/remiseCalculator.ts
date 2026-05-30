export function getRemisePercent(totalQty: number): number {
  if (totalQty >= 11) return 50;
  if (totalQty >= 6)  return 40;
  if (totalQty >= 3)  return 30;
  return 15;
}

export const REMISE_TIERS = [
  { min: 1,  max: 2,  percent: 15 },
  { min: 3,  max: 5,  percent: 30 },
  { min: 6,  max: 10, percent: 40 },
  { min: 11, max: Infinity, percent: 50 },
];
