// ============================================================================
// Query Classifier — Detects query type using pattern matching
// ============================================================================

import { QueryClassification, QueryType, SearchEntityType } from '@/lib/types/search';

// Pattern definitions
const PATTERNS: { type: QueryType; regex: RegExp; entities: SearchEntityType[] }[] = [
  // Bullion Booking number: PB-2026-XXXXX
  { type: 'purchase_booking_number', regex: /^PB-[A-Z0-9-]+$/i, entities: ['purchase_booking'] },
  // Purchase Invoice number: PUR-2026-XXXXX
  { type: 'purchase_invoice_number', regex: /^PUR-[A-Z0-9-]+$/i, entities: ['purchase_invoice'] },
  // Metal Receipt number: GRN-2026-XXXXX
  { type: 'metal_receipt_number', regex: /^GRN-[A-Z0-9-]+$/i, entities: ['purchase_receipt'] },
  // Bullion Supplier code: SUP-XXXX
  { type: 'supplier_code', regex: /^SUP-[A-Z0-9-]+$/i, entities: ['purchase_supplier'] },
  // Invoice number: INV-XXX-XX-XX-XXXX
  { type: 'invoice_number', regex: /^INV-[A-Z]{2,5}-\d{2,4}-\d{1,4}-\d{1,6}$/i, entities: ['invoice'] },
  // Order number: ORD-XXX-XXXX-XXXX
  { type: 'order_number', regex: /^ORD-[A-Z]{2,5}-\d{4}-\d{1,6}$/i, entities: ['order'] },
  // Booking number: BK-XXX-...
  { type: 'booking_number', regex: /^BK-[A-Z]{2,5}-/i, entities: ['booking'] },
  // Scheme number: SCH-XXX-...
  { type: 'scheme_number', regex: /^SCH-/i, entities: ['scheme'] },
  // Advance receipt: ADV-...
  { type: 'advance_receipt', regex: /^ADV-/i, entities: ['advance'] },
  // GSTIN: 15 char alphanumeric starting with 2 digits
  { type: 'gstin', regex: /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/i, entities: ['customer', 'wholesaler', 'purchase_supplier'] },
  // PAN: 10 char ABCDE1234F
  { type: 'pan', regex: /^[A-Z]{5}\d{4}[A-Z]{1}$/i, entities: ['customer', 'purchase_supplier'] },
  // Mobile: exactly 10 digits
  { type: 'mobile', regex: /^\d{10}$/, entities: ['customer', 'karigar', 'wholesaler', 'purchase_supplier'] },
  // HUID: 6 char alphanumeric (hallmark unique ID)
  { type: 'huid', regex: /^[A-Z0-9]{6}$/i, entities: ['product', 'huid'] },
  // RFID EPC: 16-32 char hex string (often starting with E280 or 3034)
  { type: 'rfid_epc', regex: /^(E2[0-9A-F]{14,30}|[0-9A-F]{24})$/i, entities: ['rfid', 'product'] },
  // Barcode patterns (product codes often start with letters + digits)
  { type: 'barcode', regex: /^[A-Z]{2,4}-?\d{3,10}$/i, entities: ['product'] },
];

export function classifyQuery(rawQuery: string): QueryClassification {
  const normalizedQuery = rawQuery.trim();

  if (!normalizedQuery) {
    return {
      queryType: 'text_search',
      normalizedQuery: '',
      isExactIdentifier: false,
      suggestedEntities: [],
    };
  }

  // Try each pattern
  for (const pattern of PATTERNS) {
    if (pattern.regex.test(normalizedQuery)) {
      return {
        queryType: pattern.type,
        normalizedQuery,
        isExactIdentifier: true,
        suggestedEntities: pattern.entities,
      };
    }
  }

  // Check if it's a number (could be customer ID, amount, etc.)
  if (/^\d+$/.test(normalizedQuery) && normalizedQuery.length < 10) {
    return {
      queryType: 'customer_id',
      normalizedQuery,
      isExactIdentifier: true,
      suggestedEntities: ['customer', 'invoice', 'product'],
    };
  }

  // Default: text search
  return {
    queryType: 'text_search',
    normalizedQuery,
    isExactIdentifier: false,
    suggestedEntities: [],
  };
}
