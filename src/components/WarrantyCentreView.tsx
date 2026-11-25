import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  FileCheck,
  Copy,
  Check,
  ChevronRight,
  Search,
  Download,
  SlidersHorizontal,
  X,
  Plus,
  Trash2,
  CalendarPlus
} from 'lucide-react';
import { ComponentWarranty, Product, WarrantyUnit } from '../types';
import {
  calculateDurationExpiry,
  calculateWarranty,
  formatDate,
  formatDurationLabel,
  generateWarrantyIcs,
} from '../utils/formatters';

interface WarrantyCentreViewProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onOpenAddModal: () => void;
  onUpdateWarranty?: (
    productId: string,
    warrantyMonths: number,
    extendedWarrantyMonths?: number,
    extendedWarrantyComponent?: string,
    warrantyDays?: number,
    additionalWarranties?: ComponentWarranty[]
  ) => void;
}

export const WarrantyCentreView: React.FC<WarrantyCentreViewProps> = ({
  products,
  onViewProduct,
  onOpenAddModal,
  onUpdateWarranty,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline custom warranty editor state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('12');
  const [editUnit, setEditUnit] = useState<WarrantyUnit>('months');
  const [editComponents, setEditComponents] = useState<ComponentWarranty[]>([]);

  // Compute warranties for all products
  const productWarranties = products.map((product) => ({
    product,
    warranty: calculateWarranty(
      product.purchaseDate,
      product.warrantyMonths,
      product.extendedWarrantyMonths,
      new Date(),
      product.warrantyDays
    ),
  }));

  const activeCount = productWarranties.filter((pw) => pw.warranty.status === 'active').length;
  const expiringCount = productWarranties.filter((pw) => pw.warranty.status === 'expiring_soon').length;
  const expiredCount = productWarranties.filter((pw) => pw.warranty.status === 'expired').length;

  const filteredItems = productWarranties
    .filter((pw) => {
      if (filter !== 'all' && pw.warranty.status !== filter) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        pw.product.name.toLowerCase().includes(q) ||
        pw.product.brand.toLowerCase().includes(q) ||
        (pw.product.serialNumber && pw.product.serialNumber.toLowerCase().includes(q)) ||
        (pw.product.modelNumber && pw.product.modelNumber.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.warranty.daysRemaining - b.warranty.daysRemaining);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadReminder = (product: Product, expiryDate: string) => {
    if (!expiryDate) return;
    const icsContent = generateWarrantyIcs(
      product.name,
      product.brand,
      expiryDate,
      product.customerCare
    );
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.brand.toLowerCase()}-warranty-reminder.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startEditingWarranty = (product: Product) => {
    setEditingProductId(product.id);
    if (product.warrantyDays !== undefined) {
      setEditValue(String(product.warrantyDays));
      setEditUnit('days');
    } else {
      setEditValue(String(product.warrantyMonths));
      setEditUnit('months');
    }

    if (product.additionalWarranties && product.additionalWarranties.length > 0) {
      setEditComponents(product.additionalWarranties.map((cw) => ({ ...cw })));
    } else if (product.extendedWarrantyMonths) {
      const m = product.extendedWarrantyMonths;
      setEditComponents([
        {
          id: `cw-${Date.now()}`,
          component: product.extendedWarrantyComponent || 'Compressor / Motor',
          duration: m >= 12 && m % 12 === 0 ? m / 12 : m,
          unit: m >= 12 && m % 12 === 0 ? 'years' : 'months',
        },
      ]);
    } else {
      setEditComponents([]);
    }
  };

  const handleSaveWarrantyEdit = (productId: string) => {
    if (!onUpdateWarranty) return;
    const rawVal = Math.max(0, parseInt(editValue, 10) || 0);
    const warrantyDays = editUnit === 'days' ? rawVal : undefined;
    const warrantyMonths =
      editUnit === 'days'
        ? Math.max(0, Math.round(rawVal / 30))
        : editUnit === 'years'
        ? rawVal * 12
        : rawVal;

    const validComponents = editComponents.filter((cw) => cw.component.trim() && cw.duration > 0);
    const primary = validComponents[0];
    const primaryExtMonths = primary
      ? primary.unit === 'years'
        ? primary.duration * 12
        : primary.unit === 'months'
        ? primary.duration
        : Math.max(1, Math.round(primary.duration / 30))
      : undefined;

    onUpdateWarranty(
      productId,
      warrantyMonths,
      primaryExtMonths,
      primary ? primary.component.trim() : undefined,
      warrantyDays,
      validComponents.length > 0 ? validComponents : undefined
    );
    setEditingProductId(null);
  };

  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'Brand',
      'Purchase Date',
      'Standard Warranty',
      'Expiry Date',
      'Status',
      'Days Remaining',
      'Component Warranties',
      'Serial Number',
      'Helpline',
    ];
    const rows = productWarranties.map(({ product, warranty }) => {
      const stdLabel =
        product.warrantyDays !== undefined
          ? formatDurationLabel(product.warrantyDays, 'days')
          : formatDurationLabel(product.warrantyMonths, 'months');
      const compLabel =
        product.additionalWarranties && product.additionalWarranties.length > 0
          ? product.additionalWarranties
              .map((c) => `${c.component}: ${formatDurationLabel(c.duration, c.unit)}`)
              .join(' | ')
          : product.extendedWarrantyMonths
          ? `${product.extendedWarrantyComponent || 'Component'}: ${product.extendedWarrantyMonths} Months`
          : '';
      return [
        `"${product.name.replace(/"/g, '""')}"`,
        `"${product.brand.replace(/"/g, '""')}"`,
        product.purchaseDate,
        `"${stdLabel}"`,
        warranty.formattedExpiryDate,
        warranty.status,
        warranty.daysRemaining,
        `"${compLabel.replace(/"/g, '""')}"`,
        `"${(product.serialNumber || '').replace(/"/g, '""')}"`,
        `"${(product.customerCare || '').replace(/"/g, '""')}"`,
      ];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homevault-warranties-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilter('active')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Coverage
            </span>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {activeCount}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">appliances safe</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Full brand warranty in effect</p>
        </div>

        <div
          onClick={() => setFilter('expiring_soon')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            filter === 'expiring_soon'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expiring Soon
            </span>
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {expiringCount}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">&le; 60 days remaining</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Schedule pre-expiry checkups</p>
        </div>

        <div
          onClick={() => setFilter('expired')}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            filter === 'expired'
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expired Coverage
            </span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {expiredCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">appliances out of warranty</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Extended parts may still apply</p>
        </div>
      </div>

      {/* Segmented Filter Bar + Search + Export CSV */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Warranties ({productWarranties.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('expiring_soon')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'expiring_soon'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            Expiring Soon ({expiringCount})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === 'expired'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Expired ({expiredCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by product, brand, SN..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {products.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Download Warranty Report as CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Warranties List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map(({ product, warranty }) => {
            const isEditing = editingProductId === product.id;

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{product.brand}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="capitalize">{product.category.replace('_', ' ')}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span>
                        {product.warrantyDays !== undefined
                          ? formatDurationLabel(product.warrantyDays, 'days')
                          : `${product.warrantyMonths} mo`}{' '}
                        standard
                      </span>
                      {product.storeName && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                          <span>{product.storeName}</span>
                        </>
                      )}
                    </div>
                    <h3
                      onClick={() => onViewProduct(product)}
                      className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>
                  </div>

                  {/* Status Indicator Pill/Badge + Customize Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            warranty.status === 'active'
                              ? 'bg-emerald-500'
                              : warranty.status === 'expiring_soon'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-bold ${
                            warranty.status === 'active'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : warranty.status === 'expiring_soon'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {warranty.status === 'active' && 'Active Coverage'}
                          {warranty.status === 'expiring_soon' && `${warranty.daysRemaining} Days Left`}
                          {warranty.status === 'expired' && 'Expired'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums block">
                        Expires: {warranty.formattedExpiryDate}
                      </span>
                    </div>

                    {warranty.status !== 'expired' && warranty.expiryDate && (
                      <button
                        onClick={() => handleDownloadReminder(product, warranty.expiryDate)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Download Calendar Reminder (.ics) 7 days before expiry"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    )}

                    {onUpdateWarranty && (
                      <button
                        onClick={() => (isEditing ? setEditingProductId(null) : startEditingWarranty(product))}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Customize Warranty & Components"
                      >
                        {isEditing ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={() => onViewProduct(product)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      aria-label={`View details for ${product.name}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Inline Custom Warranty Editor (Days/Months/Years + Multiple Components) */}
                {isEditing && (
                  <div className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-blue-200 dark:border-blue-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Customize Standard &amp; Component Warranties
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditComponents((prev) => [
                            ...prev,
                            { id: `cw-${Date.now()}-${prev.length}`, component: '', duration: 1, unit: 'years' },
                          ])
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Add Component
                      </button>
                    </div>

                    {/* Standard Warranty Duration + Unit */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        Standard Warranty:
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="3650"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value as WarrantyUnit)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>

                    {/* Multiple Component Rows */}
                    {editComponents.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {editComponents.map((cw) => (
                          <div key={cw.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={cw.component}
                              onChange={(e) =>
                                setEditComponents((prev) =>
                                  prev.map((item) =>
                                    item.id === cw.id ? { ...item, component: e.target.value } : item
                                  )
                                )
                              }
                              placeholder="Component (e.g. Compressor)"
                              className="sm:col-span-6 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                            <input
                              type="number"
                              min="1"
                              max="3650"
                              value={cw.duration}
                              onChange={(e) =>
                                setEditComponents((prev) =>
                                  prev.map((item) =>
                                    item.id === cw.id
                                      ? { ...item, duration: Math.max(0, parseInt(e.target.value, 10) || 0) }
                                      : item
                                  )
                                )
                              }
                              className="sm:col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                            <select
                              value={cw.unit}
                              onChange={(e) =>
                                setEditComponents((prev) =>
                                  prev.map((item) =>
                                    item.id === cw.id ? { ...item, unit: e.target.value as WarrantyUnit } : item
                                  )
                                )
                              }
                              className="sm:col-span-3 px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            >
                              <option value="days">Days</option>
                              <option value="months">Months</option>
                              <option value="years">Years</option>
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                setEditComponents((prev) => prev.filter((item) => item.id !== cw.id))
                              }
                              className="sm:col-span-1 p-1.5 text-slate-400 hover:text-red-500 cursor-pointer flex justify-center"
                              title="Remove component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingProductId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveWarrantyEdit(product.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                      >
                        Save Warranty
                      </button>
                    </div>
                  </div>
                )}

                {/* Warranty Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Purchased: {formatDate(product.purchaseDate)}</span>
                    <span>{warranty.percentageElapsed}% of term elapsed</span>
                    <span>Expires: {warranty.formattedExpiryDate}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        warranty.status === 'active'
                          ? 'bg-emerald-500'
                          : warranty.status === 'expiring_soon'
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      style={{ width: `${warranty.percentageElapsed}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Quick Row: Model, Serial, Helpline & Component Warranties */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
                    {product.serialNumber && (
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400">SN:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{product.serialNumber}</span>
                        <button
                          onClick={() => handleCopy(product.serialNumber!, `sn-${product.id}`)}
                          className="ml-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Copy Serial Number"
                        >
                          {copiedId === `sn-${product.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {product.customerCare && (
                      <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/60">
                        <Phone className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-[11px]">Helpline:</span>
                        <span className="font-mono font-semibold">{product.customerCare}</span>
                      </div>
                    )}
                  </div>

                  {/* Render multiple component warranties if present, else fallback to single extendedWarrantyMonths */}
                  <div className="flex flex-wrap items-center gap-2">
                    {product.additionalWarranties && product.additionalWarranties.length > 0 ? (
                      product.additionalWarranties.map((cw) => {
                        const compExp = calculateDurationExpiry(product.purchaseDate, cw.duration, cw.unit);
                        return (
                          <div
                            key={cw.id}
                            className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                              compExp.isExpired
                                ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                : 'text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>
                              {formatDurationLabel(cw.duration, cw.unit)} {cw.component} (Exp: {compExp.formattedExpiryDate})
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      product.extendedWarrantyMonths && (
                        <div className="text-[11px] text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800/60 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>
                            {product.extendedWarrantyMonths >= 12 && product.extendedWarrantyMonths % 12 === 0
                              ? `${product.extendedWarrantyMonths / 12} Yr`
                              : `${product.extendedWarrantyMonths} Mo`}{' '}
                            Extended {product.extendedWarrantyComponent || 'Component'} (Exp: {warranty.extendedExpiryDate})
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-md mx-auto">
          {products.length === 0 ? (
            <>
              <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No Warranties Logged Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Add your home appliances to start tracking standard, custom, and multi-component warranties.
              </p>
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Add Your First Appliance
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No warranties match the selected filter.</p>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchTerm('');
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Show all warranties ({productWarranties.length})
              </button>
            </>
          )}
        </div>
      )}

      {/* Claim Checklist & Household Guidance Card */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Indian Warranty Claim Checklist</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400 mt-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1">1. Keep Invoice Ready</strong>
            <span>Authorized service centers in India require the original dealer invoice with GSTIN &amp; serial number.</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1">2. Serial Number Sticker</strong>
            <span>Check the barcode sticker at the back/side of the appliance before calling the toll-free number.</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1">3. Record Job Sheet No.</strong>
            <span>Always ask the technician for the official brand ticket or Service Request (SR) number for tracking.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
