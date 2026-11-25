import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Store,
  ChevronRight,
  Trash2,
  Eye,
  Sparkles,
  Refrigerator,
  AirVent,
  Shirt,
  Tv,
  Laptop,
  Droplets,
  Coffee,
  Box,
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { calculateWarranty, formatINR, formatDate } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const getCategoryIcon = (category: ProductCategory) => {
  switch (category) {
    case 'kitchen':
      return Refrigerator;
    case 'cooling':
      return AirVent;
    case 'laundry':
      return Shirt;
    case 'entertainment':
      return Tv;
    case 'computing':
      return Laptop;
    case 'water_air':
      return Droplets;
    case 'small_appliances':
      return Coffee;
    default:
      return Box;
  }
};

const getCategoryLabel = (category: ProductCategory): string => {
  switch (category) {
    case 'kitchen':
      return 'Kitchen & Refrigerator';
    case 'cooling':
      return 'Air Conditioning';
    case 'laundry':
      return 'Washing & Laundry';
    case 'entertainment':
      return 'TV & Audio';
    case 'computing':
      return 'Computer & Mobile';
    case 'water_air':
      return 'Water & Air Care';
    case 'small_appliances':
      return 'Small Appliance';
    default:
      return 'Household Item';
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onDelete,
}) => {
  const warranty = calculateWarranty(
    product.purchaseDate,
    product.warrantyMonths,
    product.extendedWarrantyMonths,
    new Date(),
    product.warrantyDays
  );
  const CategoryIcon = getCategoryIcon(product.category);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 relative overflow-hidden">
      <div>
        {/* Top bar: Category info & Warranty indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CategoryIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{getCategoryLabel(product.category)}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-semibold text-slate-700">{product.brand}</span>
          </div>

          {/* Warranty Status (Clean text with status dot, no candy pill) */}
          <div className="flex items-center gap-1.5 text-xs">
            {warranty.status === 'active' && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active Warranty</span>
              </span>
            )}
            {warranty.status === 'expiring_soon' && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{warranty.statusLabel}</span>
              </span>
            )}
            {warranty.status === 'expired' && (
              <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Warranty Expired</span>
              </span>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onViewDetails(product)}
          className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mb-2 leading-snug"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Unboxed Metadata Line */}
        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
          {product.modelNumber && (
            <>
              <span>Model: <span className="font-mono text-slate-700">{product.modelNumber}</span></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
            </>
          )}
          <span>Bought: {formatDate(product.purchaseDate)}</span>
          {product.storeName && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="truncate max-w-[140px]">{product.storeName}</span>
            </>
          )}
        </div>

        {/* Extended Warranty Callout if applicable */}
        {product.extendedWarrantyMonths && product.extendedWarrantyMonths > 0 && (
          <div className="mb-4 py-1.5 px-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                {Math.round(product.extendedWarrantyMonths / 12)} Yr Extended {product.extendedWarrantyComponent || 'Coverage'}
              </span>
            </span>
            <span className="text-blue-700/80 text-[10px]">
              Exp: {warranty.extendedExpiryDate || 'Active'}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer: Price & Quick Actions */}
      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-slate-400 block leading-none mb-1">Purchase Price</span>
          <span className="text-base font-bold text-slate-900 tabular-nums">
            {formatINR(product.purchasePrice)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewDetails(product)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            aria-label={`View details for ${product.name}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            aria-label={`Delete ${product.name}`}
            title="Delete product"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

