export interface SalesCustomer {
  id?: number;
  name: string;
  mobile?: string;
  phone?: string;
  email?: string | null;
  gstin?: string | null;
}

export interface InvoiceItemDetail {
  productName: string;
  qty: number;
  grossWt: number;
  netWt: number;
  karatage: number;
  huidNumber?: string | null;
  rate: number;
  amount: number;
}

export interface SalesInvoice {
  id: string | number;
  invoiceNo: string;
  date: string;
  customer: SalesCustomer;
  items: InvoiceItemDetail[];
  itemCount: number;
  totalNetWt: number;
  subtotal: number;
  makingCharges: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  balanceDue: number;
  status: string;
  salesperson: { name: string };
  createdAt: string;
}

export interface InvoicesResponse {
  invoices: SalesInvoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SalesCategorySummary {
  category: string;
  itemsSold: number;
  netWt: number;
  revenue: number;
  percentage: number;
}

export interface TopProductSummary {
  rank: number;
  productName: string;
  sku: string;
  qtySold: number;
  revenue: number;
}

export interface PaymentBreakdownSummary {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface ReportsResponse {
  summary: {
    totalSales: number;
    totalSalesPrevPeriod: number;
    gstCollected: number;
    cgstCollected: number;
    sgstCollected: number;
    netRevenue: number;
    pendingDues: number;
    pendingInvoiceCount: number;
  };
  salesByCategory: SalesCategorySummary[];
  topProducts: TopProductSummary[];
  paymentBreakdown: PaymentBreakdownSummary[];
}

export interface RoznamaResponse {
  date: string;
  branch: string;
  openingStockValue: number;
  closingStockValue: number;
  openingGrossWeight?: number;
  openingFineWeight?: number;
  closingGrossWeight?: number;
  closingFineWeight?: number;
  invoicesRaised: number;
  itemsSold: number;
  totalWeightSold: number;
  fineWeightSold: number;
  cashCollected: number;
  upiCollected: number;
  cardCollected: number;
  creditCollected: number;
  totalCollected: number;
  newCustomers: number;
  topProduct: { name: string; qty: number; revenue: number } | null;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  avgInvoiceValue: number;
}

export interface MetalTypeSales {
  metalType: string;
  revenue: number;
  percentage: number;
}

export interface PeakHoursPoint {
  dayOfWeek: number;
  hour: number;
  txnCount: number;
}

export interface SalespersonPerformance {
  name: string;
  invoiceCount: number;
  revenue: number;
  avgTicket: number;
}

export interface AnalyticsResponse {
  revenueTrend: RevenueTrendPoint[];
  salesByMetal: MetalTypeSales[];
  salesByCategory: { category: string; revenue: number; netWt: number }[];
  peakHours: PeakHoursPoint[];
  salespersonPerformance: SalespersonPerformance[];
  customerInsights: {
    newCustomers: number;
    returningCustomers: number;
    avgLifetimeValue: number;
    repeatRate: number;
  };
  huidCompliance: {
    totalItemsSold: number;
    withHuid: number;
    withoutHuid: number;
    compliancePercent: number;
  };
}

export interface BackupStatusResponse {
  lastBackupAt: string | null;
  size: string | null;
  format: string | null;
}
