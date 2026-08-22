// ============================================================================
// Global Search Engine — TypeScript Types
// ============================================================================

// --- Enums & Literals ---

export type SearchEntityType =
  | 'customer'
  | 'product'
  | 'invoice'
  | 'order'
  | 'booking'
  | 'karigar'
  | 'wholesaler'
  | 'scheme'
  | 'huid'
  | 'advance'
  | 'rfid';

export type QueryType =
  | 'invoice_number'
  | 'order_number'
  | 'booking_number'
  | 'customer_id'
  | 'mobile'
  | 'huid'
  | 'gstin'
  | 'pan'
  | 'barcode'
  | 'scheme_number'
  | 'advance_receipt'
  | 'rfid_epc'
  | 'text_search';

export type MatchType = 'exact' | 'prefix' | 'contains' | 'fuzzy';

export type SearchStage = 'instant' | 'expanded';

export type SystemRoleType = 'ADMIN' | 'MANAGER' | 'SALESMAN' | 'VIEWER';

// --- Request Types ---

export interface SearchRequest {
  query: string;
  userId: number;
  systemRole: SystemRoleType;
  branchId: number | null;
  assignedBranchIds: number[];
  scope?: 'all' | number;            // Admin: branch override
  stage?: SearchStage;                // Stage 1 or Stage 2
  entityFilter?: SearchEntityType;    // Filter to specific entity type
  limit?: number;
  offset?: number;
}

// --- Result Types ---

export interface Badge {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'gold';
}

export interface Metric {
  label: string;
  value: string;
  icon?: string;
}

export interface RelatedEntity {
  id: string | number;
  entityType: SearchEntityType;
  title: string;
  subtitle?: string;
  navigationUrl: string;
}

export interface SearchResultDTO {
  id: string | number;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  description: string;
  badges: Badge[];
  metrics: Metric[];
  branchName: string;
  branchId: number;
  navigationUrl: string;
  matchType: MatchType;
  score: number;
  relatedEntities?: RelatedEntity[];
  icon?: string;
}

export interface SearchGroup {
  entityType: SearchEntityType;
  label: string;
  count: number;
  branchBreakdown?: Record<string, number>;
}

export interface SearchMeta {
  query: string;
  stage: SearchStage;
  totalResults: number;
  searchTimeMs: number;
  scope: 'global' | 'branch';
  appliedRole: SystemRoleType;
}

export interface SearchResponse {
  results: SearchResultDTO[];
  groups: SearchGroup[];
  meta: SearchMeta;
}

// --- Query Classification ---

export interface QueryClassification {
  queryType: QueryType;
  normalizedQuery: string;
  isExactIdentifier: boolean;
  suggestedEntities: SearchEntityType[];
}

// --- Permission Scope ---

export interface SearchPermissionScope {
  allowedEntities: SearchEntityType[];
  branchIds: number[];   // empty = all branches
  isGlobal: boolean;
  additionalFilters?: {
    // For salesman: only invoices they created
    createdByUserId?: number;
    // For salesman: customers linked via their invoices/orders
    customerFilterMode?: 'all' | 'linked';
  };
}

// --- Stage 1 entities (instant search) ---
export const STAGE_1_ENTITIES: SearchEntityType[] = [
  'customer',
  'product',
  'invoice',
  'order',
  'booking',
];

// --- Stage 2 entities (expanded search) ---
export const STAGE_2_ENTITIES: SearchEntityType[] = [
  'karigar',
  'wholesaler',
  'scheme',
  'huid',
  'advance',
  'rfid',
];

// --- All searchable entities ---
export const ALL_ENTITIES: SearchEntityType[] = [
  ...STAGE_1_ENTITIES,
  ...STAGE_2_ENTITIES,
];

// --- Entity display config ---
export const ENTITY_CONFIG: Record<SearchEntityType, { label: string; pluralLabel: string; icon: string; color: string }> = {
  customer:   { label: 'Customer',       pluralLabel: 'Customers',        icon: '👤', color: '#60A5FA' },
  product:    { label: 'Product',        pluralLabel: 'Products',         icon: '💎', color: '#C9A84C' },
  invoice:    { label: 'Invoice',        pluralLabel: 'Invoices',         icon: '🧾', color: '#34D399' },
  order:      { label: 'Order',          pluralLabel: 'Orders',           icon: '📋', color: '#A78BFA' },
  booking:    { label: 'Booking',        pluralLabel: 'Bookings',         icon: '📅', color: '#FB923C' },
  karigar:    { label: 'Karigar',        pluralLabel: 'Karigars',         icon: '🔨', color: '#F472B6' },
  wholesaler: { label: 'Wholesaler',     pluralLabel: 'Wholesalers',      icon: '🏭', color: '#38BDF8' },
  scheme:     { label: 'Saving Scheme',  pluralLabel: 'Saving Schemes',   icon: '🐷', color: '#FBBF24' },
  huid:       { label: 'HUID',          pluralLabel: 'HUIDs',            icon: '🏷️', color: '#818CF8' },
  advance:    { label: 'Advance',       pluralLabel: 'Advances',         icon: '💰', color: '#4ADE80' },
  rfid:       { label: 'RFID Tag',      pluralLabel: 'RFID Tags',        icon: '📡', color: '#EAB308' },
};
