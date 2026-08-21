// ============================================================================
// Result Ranking — Scoring algorithm for search results
// ============================================================================

import { MatchType, SearchEntityType, SearchResultDTO } from '@/lib/types/search';

// Base scores by match type
const MATCH_TYPE_SCORES: Record<MatchType, number> = {
  exact: 1000,
  prefix: 500,
  contains: 200,
  fuzzy: 100,
};

// Entity priority bonus
const ENTITY_BONUS: Record<SearchEntityType, number> = {
  customer: 50,
  invoice: 40,
  product: 30,
  order: 25,
  booking: 20,
  huid: 15,
  karigar: 10,
  wholesaler: 10,
  scheme: 5,
  advance: 5,
};

/**
 * Calculate a ranking score for a search result
 */
export function calculateScore(
  matchType: MatchType,
  entityType: SearchEntityType,
  createdAt?: Date | string | null,
  totalAmount?: number | null,
): number {
  let score = MATCH_TYPE_SCORES[matchType] || 100;

  // Entity type bonus
  score += ENTITY_BONUS[entityType] || 0;

  // Recency bonus
  if (createdAt) {
    const age = Date.now() - new Date(createdAt).getTime();
    const days = age / (1000 * 60 * 60 * 24);
    if (days <= 7) score += 30;
    else if (days <= 30) score += 20;
    else if (days <= 90) score += 10;
  }

  // Value bonus (for invoices, orders, bookings)
  if (totalAmount != null) {
    if (totalAmount > 100000) score += 15;
    else if (totalAmount > 50000) score += 10;
    else if (totalAmount > 10000) score += 5;
  }

  return score;
}

/**
 * Sort search results by score descending
 */
export function rankResults(results: SearchResultDTO[]): SearchResultDTO[] {
  return [...results].sort((a, b) => b.score - a.score);
}

/**
 * Determine match type by comparing query against a field value
 */
export function determineMatchType(
  query: string,
  fieldValue: string | null | undefined,
): MatchType {
  if (!fieldValue) return 'contains';

  const q = query.toLowerCase();
  const v = fieldValue.toLowerCase();

  if (v === q) return 'exact';
  if (v.startsWith(q)) return 'prefix';
  if (v.includes(q)) return 'contains';
  return 'fuzzy';
}
