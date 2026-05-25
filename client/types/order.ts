export type OrderItem = {
  id: string;
  categoryId: number;
  category?: { id: number; name: string };
  weight?: number;
  measurement?: string;
  description?: string;
  images?: string[];
  voiceUrl?: string | null;
  createdAt?: string;
};

export type Advance = {
  id: string;
  advanceReceiptNumber: string;
  metalType?: string;
  metalWeight: number;
  metalPurity?: string;
  moneyAmount: number;
  paymentMethod?: string;
  paymentRef?: string;
  isApplied: boolean;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId?: number;
  customer?: { id: number; name: string; mobile: string };
  customerName: string;
  customerMobile: string;
  karigarId?: string;
  karigar?: { id: string; name: string; department?: string } | null;
  status: string;
  priority: string;
  advance?: Advance;
  notes?: string;
  deliveryDate: string;
  orderDate?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
};
