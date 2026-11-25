import React from 'react';
import {
  Boxes,
  ShieldCheck,
  Clock,
  Wrench,
  Plus,
  ArrowRight,
  ShieldAlert,
  Calendar,
  IndianRupee,
  Sparkles,
  Phone,
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Product, ServiceRecord, ActiveTab, ProductCategory } from '../types';
import { calculateWarranty, formatINR, formatDate } from '../utils/formatters';
import { ProductCard } from './ProductCard';
import { Camera } from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  serviceRecords: ServiceRecord[];
  onOpenAddModal: (preset?: {
    category?: ProductCategory;
    name?: string;
    warrantyMonths?: string;
    hasExtendedWarranty?: boolean;
    extendedComponent?: string;
    extendedMonths?: string;
  }) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onOpenCamera?: () => void;
  onLoadDemoData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  serviceRecords,
  onOpenAddModal,
  onNavigateTab,
  onViewProduct,
  onDeleteProduct,
  onOpenCamera,
  onLoadDemoData,
}) => {
  // Compute analytics
  const totalValue = products.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);

  const productWarranties = products.map((p) => ({
    product: p,
    warranty: calculateWarranty(
      p.purchaseDate,
      p.warrantyMonths,
      p.extendedWarrantyMonths,
      new Date(),
      p.warrantyDays
    ),
  }));

  // Upcoming or overdue service reminders (next 30 days)
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const upcomingServices = serviceRecords
    .filter((s) => {
      if (!s.nextDueDate) return false;
      const [y, m, d] = s.nextDueDate.split('-').map(Number);
      const due = new Date(y, m - 1, d);
      const diffDays = Math.round((due.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    })
    .sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''));

  const activeWarranties = productWarranties.filter((pw) => pw.warranty.status === 'active');
  const expiringSoonWarranties = productWarranties.filter((pw) => pw.warranty.status === 'expiring_soon');
  const expiredWarranties = productWarranties.filter((pw) => pw.warranty.status === 'expired');

  // Sorted upcoming expirations
  const upcomingExpirations = [...productWarranties]
    .filter((pw) => pw.warranty.daysRemaining >= 0)
    .sort((a, b) => a.warranty.daysRemaining - b.warranty.daysRemaining)
    .slice(0, 4);

  // Recently added products (last 4)
  const recentlyAdded = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Quick preset shortcuts for Indian households
  const QUICK_PRESETS = [
    {
      label: 'Air Conditioner',
      icon: '❄️',
      preset: {
        category: 'cooling' as ProductCategory,
        name: 'Split Air Conditioner 1.5T',
        warrantyMonths: '12',
        hasExtendedWarranty: true,
        extendedComponent: 'Inverter Compressor & PCB',
        extendedMonths: '60',
      },
    },
    {
      label: 'Refrigerator',
      icon: '🧊',
      preset: {
        category: 'kitchen' as ProductCategory,
        name: 'Double Door Refrigerator',
        warrantyMonths: '12',
        hasExtendedWarranty: true,
        extendedComponent: 'Smart Inverter Compressor',
        extendedMonths: '120',
      },
    },
    {
      label: 'Washing Machine',
      icon: '🧺',
      preset: {
        category: 'laundry' as ProductCategory,
        name: 'Front Load Washing Machine',
        warrantyMonths: '24',
        hasExtendedWarranty: true,
        extendedComponent: 'Drive Motor',
        extendedMonths: '120',
      },
    },
    {
      label: 'Smart TV',
      icon: '📺',
      preset: {
        category: 'entertainment' as ProductCategory,
        name: '4K Ultra HD Smart TV',
        warrantyMonths: '24',
        hasExtendedWarranty: false,
      },
    },
    {
      label: 'Laptop / PC',
      icon: '💻',
      preset: {
        category: 'computing' as ProductCategory,
        name: 'Laptop Computer',
        warrantyMonths: '12',
        hasExtendedWarranty: false,
      },
    },
    {
      label: 'Water Purifier',
      icon: '💧',
      preset: {
        category: 'water_air' as ProductCategory,
        name: 'RO + UV Water Purifier',
        warrantyMonths: '12',
        hasExtendedWarranty: false,
      },
    },
    {
      label: 'Microwave / Oven',
      icon: '♨️',
      preset: {
        category: 'kitchen' as ProductCategory,
        name: 'Convection Microwave Oven',
        warrantyMonths: '12',
        hasExtendedWarranty: true,
        extendedComponent: 'Magnetron Tube',
        extendedMonths: '60',
      },
    },
    {
      label: 'Smartphone',
      icon: '📱',
      preset: {
        category: 'computing' as ProductCategory,
        name: 'Smartphone',
        warrantyMonths: '12',
        hasExtendedWarranty: false,
      },
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Upcoming Service & Maintenance Reminder Banner */}
      {upcomingServices.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Service Due Soon ({upcomingServices.length})
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {upcomingServices[0].productName} ({upcomingServices[0].serviceType.replace('_', ' ')}) due on{' '}
                <span className="font-semibold">{formatDate(upcomingServices[0].nextDueDate)}</span>
                {upcomingServices.length > 1 ? ` and ${upcomingServices.length - 1} more` : ''}.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('services')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-900 hover:bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700 transition-colors cursor-pointer shrink-0"
          >
            <span>View Service Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#101D42] to-[#1C2541] text-white p-6 sm:p-8 border border-slate-800 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold mb-3">
            <span>HomeVault India</span>
            <span aria-hidden="true">·</span>
            <span>Household Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Your home, organised.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-xl">
            Everything your home owns. Nothing your home forgets. Add your real purchases, snap invoice bills with your camera, and track warranty expiries seamlessly.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenAddModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Real Purchase</span>
            </button>
            {onOpenCamera && (
              <button
                onClick={onOpenCamera}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium rounded-lg border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Bill with Camera</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('products')}
              className="px-4 py-2.5 bg-transparent hover:bg-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View All ({products.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle Decorative Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>
      </div>

      {/* When Vault is Empty: Render Quick Start Category Shortcuts */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Start by Adding Your Appliances
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Click any common household appliance below to quick-add it to your vault:
              </p>
            </div>
            {onLoadDemoData && (
              <button
                onClick={onLoadDemoData}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto cursor-pointer"
              >
                Preview with Demo Items
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => onOpenAddModal(item.preset)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left flex items-center gap-3 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400">Click to add</div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </div>
              <div>
                <strong className="text-slate-900 block mb-0.5">Enter Purchase Details</strong>
                <span>Log price in ₹, purchase date, brand and dealer.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </div>
              <div>
                <strong className="text-slate-900 block mb-0.5">Snap Invoice &amp; Warranty</strong>
                <span>Use your camera to preserve receipts for GST &amp; claims.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </div>
              <div>
                <strong className="text-slate-900 block mb-0.5">Automatic Expiry Tracking</strong>
                <span>Get timely alerts before 1-yr and extended coverage ends.</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Summary Cards Strip (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Products
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {products.length}
            </span>
            <span className="text-xs text-slate-400">appliances</span>
          </div>
          <div className="text-xs text-slate-500">
            Total Value: <span className="font-semibold text-slate-800 tabular-nums">{formatINR(totalValue)}</span>
          </div>
        </div>

        {/* Card 2: Active Warranties */}
        <div
          onClick={() => onNavigateTab('warranties')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Warranties
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {activeWarranties.length}
            </span>
            <span className="text-xs text-emerald-600 font-medium">covered</span>
          </div>
          <div className="text-xs text-slate-500">
            {products.length > 0
              ? `${Math.round((activeWarranties.length / products.length) * 100)}% of household covered`
              : 'No appliances logged'}
          </div>
        </div>

        {/* Card 3: Expiring Soon */}
        <div
          onClick={() => onNavigateTab('warranties')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expiring Soon
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {expiringSoonWarranties.length}
            </span>
            <span className="text-xs text-amber-600 font-medium">within 60 days</span>
          </div>
          <div className="text-xs text-slate-500">
            {expiringSoonWarranties.length > 0 ? 'Requires attention soon' : 'No urgent expirations'}
          </div>
        </div>

        {/* Card 4: Recent Repairs */}
        <div
          onClick={() => onNavigateTab('services')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent Repairs
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {serviceRecords.length}
            </span>
            <span className="text-xs text-slate-400">services</span>
          </div>
          <div className="text-xs text-slate-500">
            Logged maintenance events
          </div>
        </div>
      </div>

      {/* Main Two-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recently Added Products (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recently Added Products
              </h3>
              <p className="text-xs text-slate-500">
                Latest appliances and household assets registered in your vault.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentlyAdded.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-3">No products added yet.</p>
              <button
                onClick={() => onOpenAddModal()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Add Your First Appliance
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentlyAdded.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewProduct}
                  onDelete={onDeleteProduct}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Warranty Expirations & Quick Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Warranty Expirations Section */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Upcoming Expirations
                </h3>
                <p className="text-xs text-slate-500">
                  Warranties expiring soonest
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('warranties')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                All warranties
              </button>
            </div>

            {upcomingExpirations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No active warranties recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingExpirations.map(({ product, warranty }) => (
                  <div
                    key={product.id}
                    onClick={() => onViewProduct(product)}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
                        <span className="font-semibold text-slate-700">{product.brand}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="truncate">{product.category.replace('_', ' ')}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Expiry: {warranty.formattedExpiryDate}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold tabular-nums block ${
                          warranty.isExpiringSoon
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {warranty.daysRemaining}d left
                      </span>
                      {product.customerCare && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Care: {product.customerCare}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indian Household Quick Guide Box */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-blue-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Smart Indian Household Tip</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Did you know? Most Indian home appliance brands (like Daikin, LG, IFB) offer separate extended warranties for compressors and motors for up to 10 years, even when the standard warranty expires after 1 year.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>HomeVault Records</span>
              <span className="text-blue-300 font-medium">Automatic Alerts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
