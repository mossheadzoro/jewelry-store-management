// ============================================================================
// Permission Scope — RBAC-based search permission resolver
// ============================================================================
//
// ADMIN      → ALL branches, ALL entities (global default)
// MANAGER    → Assigned branches only, ALL entities within those branches
// SALESMAN   → Own branch, Products + Customers + Invoices only
// VIEWER     → Assigned branches, read-only entities per role.permissions
// ============================================================================

import {
  SearchPermissionScope,
  SearchEntityType,
  SystemRoleType,
  ALL_ENTITIES,
  STAGE_1_ENTITIES,
} from '@/lib/types/search';

interface UserContext {
  userId: number;
  systemRole: SystemRoleType;
  branchId: number | null;
  assignedBranchIds: number[];   // From UserBranch table
  rolePermissions?: any;         // From Role.permissions JSON
}

// Entities that salesman can access
const SALESMAN_ENTITIES: SearchEntityType[] = [
  'product',
  'customer',
  'invoice',
];

// Module to entity mapping for viewer permissions
const MODULE_ENTITY_MAP: Record<string, SearchEntityType> = {
  customer: 'customer',
  customers: 'customer',
  inventory: 'product',
  products: 'product',
  billing: 'invoice',
  invoices: 'invoice',
  sales: 'invoice',
  orders: 'order',
  orderBook: 'order',
  bookings: 'booking',
  karigar: 'karigar',
  wholesaler: 'wholesaler',
  schemes: 'scheme',
};

export function resolvePermissionScope(
  user: UserContext,
  requestedScope?: 'all' | number,
): SearchPermissionScope {
  const { systemRole, userId, branchId, assignedBranchIds, rolePermissions } = user;

  switch (systemRole) {
    case 'ADMIN':
      return resolveAdminScope(requestedScope);
    case 'MANAGER':
      return resolveManagerScope(branchId, assignedBranchIds);
    case 'SALESMAN':
      return resolveSalesmanScope(userId, branchId);
    case 'VIEWER':
      return resolveViewerScope(branchId, assignedBranchIds, rolePermissions);
    default:
      // Fallback: no access
      return {
        allowedEntities: [],
        branchIds: [],
        isGlobal: false,
      };
  }
}

function resolveAdminScope(requestedScope?: 'all' | number): SearchPermissionScope {
  // Admin is global by default. Not tied to sidebar branch selector.
  // Can optionally scope to a specific branch via the search UI.
  if (requestedScope && requestedScope !== 'all') {
    return {
      allowedEntities: ALL_ENTITIES,
      branchIds: [requestedScope as number],
      isGlobal: false,
    };
  }

  return {
    allowedEntities: ALL_ENTITIES,
    branchIds: [],    // empty = all branches
    isGlobal: true,
  };
}

function resolveManagerScope(
  primaryBranchId: number | null,
  assignedBranchIds: number[],
): SearchPermissionScope {
  // Manager searches only their assigned branches
  const branchIds = [...new Set([
    ...(primaryBranchId ? [primaryBranchId] : []),
    ...assignedBranchIds,
  ])];

  return {
    allowedEntities: ALL_ENTITIES,
    branchIds,
    isGlobal: false,
  };
}

function resolveSalesmanScope(
  userId: number,
  branchId: number | null,
): SearchPermissionScope {
  // Salesman: only Products, Customers, Invoices within their branch
  // Additionally, invoices are filtered to ones they created
  // Customers are filtered to ones linked via their invoices/orders
  return {
    allowedEntities: SALESMAN_ENTITIES,
    branchIds: branchId ? [branchId] : [],
    isGlobal: false,
    additionalFilters: {
      createdByUserId: userId,
      customerFilterMode: 'linked',
    },
  };
}

function resolveViewerScope(
  branchId: number | null,
  assignedBranchIds: number[],
  rolePermissions?: any,
): SearchPermissionScope {
  const branchIds = [...new Set([
    ...(branchId ? [branchId] : []),
    ...assignedBranchIds,
  ])];

  // Determine allowed entities from role permissions
  let allowedEntities: SearchEntityType[] = [];

  if (rolePermissions) {
    // Handle wildcard permissions {"*": true}
    if (typeof rolePermissions === 'object' && !Array.isArray(rolePermissions) && rolePermissions['*'] === true) {
      allowedEntities = [...ALL_ENTITIES];
    } else if (Array.isArray(rolePermissions)) {
      // Handle permission array [{module: "customer", action: "view"}, ...]
      const viewableModules = rolePermissions
        .filter((p: any) => p.action === 'view')
        .map((p: any) => p.module);

      allowedEntities = [...new Set(
        viewableModules
          .map((m: string) => MODULE_ENTITY_MAP[m])
          .filter(Boolean)
      )] as SearchEntityType[];
    }
  }

  // Fallback: at least let them search Stage 1 entities
  if (allowedEntities.length === 0) {
    allowedEntities = [...STAGE_1_ENTITIES];
  }

  return {
    allowedEntities,
    branchIds,
    isGlobal: false,
  };
}
