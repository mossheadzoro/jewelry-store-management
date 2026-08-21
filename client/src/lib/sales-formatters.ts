import { format } from "date-fns";

export const formatINR = (amount: number): string => {
  const safeNum = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeNum);
};

export const formatWeight = (grams: number): string =>
  `${(grams || 0).toFixed(3)}g`;

export const formatInvoiceDate = (date: string | Date): string => {
  if (!date) return "";
  return format(new Date(date), "dd MMM yyyy");
};

export const trendColor = (change: number): string =>
  change >= 0 ? "text-green-500" : "text-red-500";

export const trendIcon = (change: number): string =>
  change >= 0 ? "▲" : "▼";
