export const roundFineGold = (val: number): number => {
  if (!val || isNaN(val)) return 0;
  // Round to 2 decimal places where 0.005 rounds up to 0.010 (0.01)
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return Number(rounded.toFixed(3));
};

export const formatFineGold = (val: number): string => {
  return `${roundFineGold(val).toFixed(3)}g`;
};

export const toFineGold = (weight: number, purity: number): number =>
  roundFineGold(weight * purity);
