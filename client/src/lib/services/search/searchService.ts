// ============================================================================
// Search Service — Central Orchestrator
// ============================================================================
// This is the heart of the search engine. Not a route handler, but a reusable
// service that coordinates query classification, permission scoping, entity
// searching, ranking, and result building.
// ============================================================================

import {
  SearchRequest,
  SearchResponse,
  SearchResultDTO,
  SearchGroup,
  SearchEntityType,
  STAGE_1_ENTITIES,
  STAGE_2_ENTITIES,
  ENTITY_CONFIG,
} from '@/lib/types/search';
import { classifyQuery } from './queryClassifier';
import { resolvePermissionScope } from './permissionScope';
import { rankResults } from './resultRanking';
import {
  searchCustomers,
  searchProducts,
  searchInvoices,
  searchOrders,
  searchBookings,
  searchKarigars,
  searchWholesalers,
  searchSchemes,
  searchHuids,
  searchAdvances,
} from './entitySearchers';

// Map entity types to their searcher functions
const SEARCHER_MAP: Record<SearchEntityType, (query: string, scope: any, limit: number) => Promise<SearchResultDTO[]>> = {
  customer: searchCustomers,
  product: searchProducts,
  invoice: searchInvoices,
  order: searchOrders,
  booking: searchBookings,
  karigar: searchKarigars,
  wholesaler: searchWholesalers,
  scheme: searchSchemes,
  huid: searchHuids,
  advance: searchAdvances,
};

export async function search(request: SearchRequest): Promise<SearchResponse> {
  const startTime = Date.now();

  const {
    query,
    userId,
    systemRole,
    branchId,
    assignedBranchIds,
    scope: requestedScope,
    stage = 'instant',
    entityFilter,
    limit = 5,
  } = request;

  // 1. Classify the query
  const classification = classifyQuery(query);

  // 2. Resolve RBAC permission scope
  const permissionScope = resolvePermissionScope(
    { userId, systemRole, branchId, assignedBranchIds },
    requestedScope,
  );

  // 3. Determine which entities to search
  let entitiesToSearch: SearchEntityType[];

  if (entityFilter) {
    // Specific entity filter from the UI
    entitiesToSearch = [entityFilter];
  } else if (classification.isExactIdentifier && classification.suggestedEntities.length > 0) {
    // Query classifier suggests specific entities
    entitiesToSearch = classification.suggestedEntities;
  } else if (stage === 'instant') {
    // Stage 1: only fast entities
    entitiesToSearch = [...STAGE_1_ENTITIES];
  } else {
    // Stage 2 (expanded): all entities
    entitiesToSearch = [...STAGE_1_ENTITIES, ...STAGE_2_ENTITIES];
  }

  // Filter out entities the user doesn't have permission to access
  entitiesToSearch = entitiesToSearch.filter(e =>
    permissionScope.allowedEntities.includes(e)
  );

  // 4. Run searches in parallel
  const searchPromises = entitiesToSearch.map(async (entityType) => {
    try {
      const searcher = SEARCHER_MAP[entityType];
      if (!searcher) return [];
      return await searcher(classification.normalizedQuery, permissionScope, limit);
    } catch (error) {
      console.error(`Search error for ${entityType}:`, error);
      return [];
    }
  });

  const searchResults = await Promise.all(searchPromises);

  // 5. Flatten and rank results
  const allResults = searchResults.flat();
  const rankedResults = rankResults(allResults);

  // 6. Build groups
  const groups: SearchGroup[] = entitiesToSearch.map(entityType => {
    const entityResults = rankedResults.filter(r => r.entityType === entityType);
    const config = ENTITY_CONFIG[entityType];

    // Build branch breakdown for admin
    const branchBreakdown: Record<string, number> = {};
    if (permissionScope.isGlobal) {
      entityResults.forEach(r => {
        const bn = r.branchName || 'Unknown';
        branchBreakdown[bn] = (branchBreakdown[bn] || 0) + 1;
      });
    }

    return {
      entityType,
      label: config.pluralLabel,
      count: entityResults.length,
      branchBreakdown: Object.keys(branchBreakdown).length > 0 ? branchBreakdown : undefined,
    };
  }).filter(g => g.count > 0);

  // 7. Build response
  const searchTimeMs = Date.now() - startTime;

  return {
    results: rankedResults,
    groups,
    meta: {
      query,
      stage,
      totalResults: rankedResults.length,
      searchTimeMs,
      scope: permissionScope.isGlobal ? 'global' : 'branch',
      appliedRole: systemRole,
    },
  };
}
