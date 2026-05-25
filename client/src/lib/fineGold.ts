export const toFineGold = (weight: number, purity: number) =>
  Number((weight * purity).toFixed(4))
