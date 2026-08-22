// client/src/lib/rfid/types.ts

export type RFIDTagStatus =
  | 'UNASSIGNED'
  | 'ENCODED'
  | 'ASSIGNED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REPLACED'
  | 'RETIRED';

export type RFIDConnectionType =
  | 'NETWORK_TCP'
  | 'HTTP_REST'
  | 'WEBSOCKET'
  | 'SERIAL_USB'
  | 'MOCK_SIMULATOR';

export type RFIDReaderStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'ERROR'
  | 'SCANNING'
  | 'CALIBRATING';

export type RFIDZoneType =
  | 'COUNTER'
  | 'SHOWROOM'
  | 'VAULT'
  | 'SAFE'
  | 'REPAIR_WORKSHOP'
  | 'KARIGAR_DESK'
  | 'PACKAGING'
  | 'DISPATCH'
  | 'RECEIVING'
  | 'ENTRANCE_GATE';

export type RFIDScanSessionType =
  | 'QUICK_SCAN'
  | 'INVENTORY_AUDIT'
  | 'ZONE_AUDIT'
  | 'TRANSFER_DISPATCH'
  | 'TRANSFER_RECEIVE'
  | 'SAFE_AUDIT'
  | 'BILLING_ASSIST'
  | 'MANUAL_SCAN';

export type RFIDScanStatus =
  | 'CREATED'
  | 'SCANNING'
  | 'REVIEW'
  | 'APPROVED'
  | 'CLOSED'
  | 'CANCELLED';

export type RFIDReconciliationStatus =
  | 'MATCHED'
  | 'MISSING'
  | 'UNEXPECTED'
  | 'WRONG_ZONE'
  | 'WRONG_BRANCH'
  | 'STATUS_MISMATCH'
  | 'UNASSIGNED'
  | 'SOLD_DETECTED';

export type RFIDExceptionType =
  | 'MISSING'
  | 'UNEXPECTED'
  | 'WRONG_ZONE'
  | 'WRONG_BRANCH'
  | 'STATUS_MISMATCH'
  | 'SOLD_ITEM_DETECTED'
  | 'UNASSIGNED_TAG'
  | 'SECURITY_ALERT'
  | 'HIGH_VALUE_ALERT';

export type RFIDExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RFIDExceptionStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export type RFIDResolutionType =
  | 'ITEM_FOUND'
  | 'LOCATION_UPDATED'
  | 'TRANSFER_IN_PROGRESS'
  | 'SALE_PENDING'
  | 'RFID_TAG_REPLACED'
  | 'FALSE_POSITIVE'
  | 'MANUAL_CORRECTION'
  | 'OTHER';

// Raw read event payload received from readers/gateways
export interface RawRFIDReadPacket {
  epc: string;
  tid?: string;
  readerId: string;
  antennaNo?: number;
  rssi?: number;
  frequency?: number;
  phase?: number;
  timestamp?: string | number | Date;
}

// Normalized and deduplicated observation
export interface NormalizedRFIDObservation {
  epc: string;
  readerId: string;
  antennaNo?: number;
  branchId: number;
  zoneId?: string;
  peakRssi: number;
  readCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

// Reconciliation Item Breakdown
export interface ReconciliationItem {
  id?: number;
  productCode?: string;
  barcode?: string;
  huidNumber?: string | null;
  name: string;
  category?: string;
  subCategory?: string;
  gsWeight?: number;
  ntWeight?: number;
  purity?: number;
  price?: number | null;
  epc: string;
  expectedBranchId?: number;
  expectedBranchName?: string;
  expectedZoneId?: string | null;
  expectedZoneName?: string;
  detectedBranchId?: number;
  detectedBranchName?: string;
  detectedZoneId?: string | null;
  detectedZoneName?: string;
  reconciliationStatus: RFIDReconciliationStatus;
  inventoryStatus?: string;
  lastRssi?: number | null;
  readCount?: number;
  firstSeenAt?: Date | string;
  lastSeenAt?: Date | string;
  isHighValue?: boolean;
  exceptionId?: string;
}

export interface ReconciliationSummary {
  totalExpected: number;
  totalDetected: number;
  matchedCount: number;
  missingCount: number;
  unexpectedCount: number;
  wrongZoneCount: number;
  wrongBranchCount: number;
  statusMismatchCount: number;
  unassignedCount: number;
  soldDetectedCount: number;
  accuracyPercentage: number;
}

// Hardware Adapter Configuration
export interface ReaderAdapterConfig {
  readerId: string;
  name: string;
  ipAddress?: string | null;
  port?: number | null;
  connectionType: RFIDConnectionType;
  powerDbm: number;
  branchId: number;
  zoneId?: string | null;
  isMock?: boolean;
  metadata?: Record<string, any> | null;
}
