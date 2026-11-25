export type ProductCategory =
  | 'kitchen'
  | 'cooling'
  | 'laundry'
  | 'entertainment'
  | 'computing'
  | 'water_air'
  | 'small_appliances'
  | 'other';

export interface CategoryMeta {
  id: ProductCategory;
  label: string;
  iconName: string;
  color: string;
}

export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired';

export type WarrantyUnit = 'days' | 'months' | 'years';

export interface ComponentWarranty {
  id: string;
  component: string;
  duration: number;
  unit: WarrantyUnit;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number; // in INR
  warrantyMonths: number;
  warrantyDays?: number; // When set, standard warranty is measured in exact days
  extendedWarrantyMonths?: number;
  extendedWarrantyComponent?: string; // e.g., 'Compressor', 'Motor', 'Screen panel'
  additionalWarranties?: ComponentWarranty[]; // Multiple component-specific warranties
  storeName?: string;
  invoiceNumber?: string;
  customerCare?: string;
  notes?: string;
  invoiceImageUrl?: string;
  invoiceFileName?: string;
  warrantyCardImageUrl?: string;
  warrantyCardFileName?: string;
  createdAt: string;
}

export interface WarrantyDetails {
  status: WarrantyStatus;
  statusLabel: string;
  expiryDate: string;
  formattedExpiryDate: string;
  daysRemaining: number;
  percentageElapsed: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  extendedExpiryDate?: string;
  extendedDaysRemaining?: number;
}

export interface ServiceRecord {
  id: string;
  productId: string;
  productName: string;
  serviceDate: string;
  serviceType: 'routine' | 'repair' | 'installation' | 'filter_replacement';
  cost: number;
  provider: string;
  description: string;
  nextDueDate?: string;
}

export type ActiveTab = 'dashboard' | 'products' | 'warranties' | 'invoices' | 'services';
