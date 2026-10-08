export type ImageRef = { secureUrl: string; publicId: string };

export type CategoryRef = { id: string; name: string; nameBn: string; slug: string };

export type Category = CategoryRef & {
  description: string;
  descriptionBn: string;
  image: ImageRef | null;
  status: string;
};

export type Product = {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  sku: string;
  barcode?: string;
  category: CategoryRef | null;
  unit: string;
  sellingPrice: number;
  wholesalePrice: number;
  purchasePrice?: number;
  minimumSellingPrice?: number;
  stock: number;
  minimumStock?: number;
  stockStatus: 'in' | 'low' | 'out';
  images: ImageRef[];
  status: string;
  isFeatured: boolean;
};

export type Paged<T> = { items: T[]; page: number; limit: number; total: number; pages?: number };

export type Party = {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  district?: string;
  area?: string;
  businessName?: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  notes: string;
};

export type LedgerEntry = {
  id: string;
  partyType: string;
  partyId: string;
  direction: 'debit' | 'credit';
  amount: number;
  balanceAfter: number;
  description: string;
  entryDate: string;
  referenceType: string;
};

export type LedgerBook = {
  party: {
    id: string;
    name: string;
    phone: string;
    address: string;
    notes: string;
    businessName: string;
    totalPurchases: number;
    totalPaid: number;
    totalDue: number;
  };
  entries: LedgerEntry[];
};

export type Profile = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  permissions: string[];
  phone: string;
};

export type PublicSettings = {
  onlineOrderingEnabled: boolean;
  deliveryCharge: number;
  taxPercent: number;
  manualPayments: { bkash: string; nagad: string; rocket: string };
  paymentQr?: { bkash: string; nagad: string; rocket: string };
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    routingNumber: string;
  };
  cardPaymentsEnabled?: boolean;
};

export type CartLine = {
  productId: string;
  name: string;
  nameBn: string;
  unit: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
};

export type DashboardStats = {
  today: { sales: number; purchase: number; profit: number | null; expenses: number };
  totals: {
    sales: number;
    purchase: number;
    profit: number | null;
    due: number;
    customers: number;
    products: number;
    lowStock: number;
    pendingOrders: number;
    expenses: number;
  };
  profit: { sales: number; revenue: number; cost: number; profit: number; margin: number } | null;
  lowStock: Product[];
  trend: { date: string; sales: number; profit: number | null }[];
  categories: { name: string; count: number }[];
};
