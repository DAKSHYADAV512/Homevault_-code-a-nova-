import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Building2,
  Calendar,
  IndianRupee,
  Camera,
  Upload,
  Trash2,
  FileText,
  Check
} from 'lucide-react';
import { ComponentWarranty, Product, ProductCategory, WarrantyUnit } from '../types';
import {
  calculateDurationExpiry,
  calculateWarranty,
  CATEGORY_OPTIONS,
  POPULAR_INDIAN_BRANDS,
  POPULAR_INDIAN_RETAILERS,
} from '../utils/formatters';
import { compressImage } from '../utils/camera';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  initialPreset?: {
    category?: ProductCategory;
    name?: string;
    warrantyMonths?: string;
    hasExtendedWarranty?: boolean;
    extendedComponent?: string;
    extendedMonths?: string;
  } | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPreset,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('kitchen');
  const [brand, setBrand] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [purchasePrice, setPurchasePrice] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [warrantyDays, setWarrantyDays] = useState<number | undefined>(undefined);
  const [isCustomWarranty, setIsCustomWarranty] = useState(false);
  const [warrantyUnit, setWarrantyUnit] = useState<WarrantyUnit>('months');
  const [warrantyInputValue, setWarrantyInputValue] = useState('12');
  const [hasExtendedWarranty, setHasExtendedWarranty] = useState(false);
  const [componentWarranties, setComponentWarranties] = useState<ComponentWarranty[]>([
    { id: 'cw-1', component: 'Inverter Compressor / Motor', duration: 10, unit: 'years' },
  ]);
  const [storeName, setStoreName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [customerCare, setCustomerCare] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceImageUrl, setInvoiceImageUrl] = useState<string | undefined>();
  const [invoiceFileName, setInvoiceFileName] = useState<string | undefined>();
  const [warrantyCardImageUrl, setWarrantyCardImageUrl] = useState<string | undefined>();
  const [warrantyCardFileName, setWarrantyCardFileName] = useState<string | undefined>();

  const invoiceInputRef = useRef<HTMLInputElement | null>(null);
  const warrantyInputRef = useRef<HTMLInputElement | null>(null);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset or preset form when opened
  useEffect(() => {
    if (isOpen) {
      setName(initialPreset?.name || '');
      setCategory(initialPreset?.category || 'kitchen');
      setBrand('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchasePrice('');
      const presetWarranty = initialPreset?.warrantyMonths || '12';
      setWarrantyMonths(presetWarranty);
      setWarrantyDays(undefined);
      const isPresetStandard = ['6', '12', '24', '36', '60'].includes(presetWarranty);
      setIsCustomWarranty(!isPresetStandard);
      setWarrantyUnit('months');
      setWarrantyInputValue(presetWarranty);

      setHasExtendedWarranty(initialPreset?.hasExtendedWarranty || false);
      const presetExtendedMonths = parseInt(initialPreset?.extendedMonths || '120', 10) || 120;
      setComponentWarranties([
        {
          id: `cw-${Date.now()}`,
          component: initialPreset?.extendedComponent || 'Inverter Compressor / Motor',
          duration: presetExtendedMonths >= 12 && presetExtendedMonths % 12 === 0 ? presetExtendedMonths / 12 : presetExtendedMonths,
          unit: presetExtendedMonths >= 12 && presetExtendedMonths % 12 === 0 ? 'years' : 'months',
        },
      ]);
      setStoreName('');
      setModelNumber('');
      setSerialNumber('');
      setCustomerCare('');
      setNotes('');
      setInvoiceImageUrl(undefined);
      setInvoiceFileName(undefined);
      setWarrantyCardImageUrl(undefined);
      setWarrantyCardFileName(undefined);
      setErrors({});
      setTouched({});
    }
  }, [isOpen, initialPreset]);

  // Auto-fill common customer care numbers for Indian brands
  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand);
    const bLower = newBrand.toLowerCase().trim();
    if (bLower === 'lg') setCustomerCare('1800-315-9999');
    else if (bLower === 'samsung') setCustomerCare('1800-40-7267864');
    else if (bLower === 'daikin') setCustomerCare('1860-180-3900');
    else if (bLower === 'ifb') setCustomerCare('1800-3000-5678');
    else if (bLower === 'kent') setCustomerCare('9278-10-10-10');
    else if (bLower === 'voltas') setCustomerCare('1860-599-4555');
    else if (bLower === 'apple') setCustomerCare('000800 1009009');
    else if (bLower === 'sony') setCustomerCare('1800-103-7799');
    else if (bLower === 'havells') setCustomerCare('1800-11-0303');
    else if (bLower === 'whirlpool') setCustomerCare('1800-208-1800');
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required (e.g. LG Double Door Refrigerator)';
    }

    if (!brand.trim()) {
      newErrors.brand = 'Brand is required (e.g. LG, Samsung, Daikin)';
    }

    if (!purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    const priceNum = parseFloat(purchasePrice);
    if (!purchasePrice.trim() || isNaN(priceNum) || priceNum <= 0) {
      newErrors.purchasePrice = 'Enter a valid purchase price in ₹ (e.g. 42990)';
    }

    const wMonths = parseInt(warrantyMonths, 10);
    if (warrantyDays === undefined && (!warrantyMonths || isNaN(wMonths) || wMonths < 0)) {
      newErrors.warrantyMonths = 'Enter a valid standard warranty period';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      brand: true,
      purchaseDate: true,
      purchasePrice: true,
      warrantyMonths: true,
    });

    if (!validate()) return;

    const validComponents = hasExtendedWarranty
      ? componentWarranties.filter((cw) => cw.component.trim() && cw.duration > 0)
      : [];
    const primaryExt = validComponents[0];
    const primaryExtMonths = primaryExt
      ? primaryExt.unit === 'years'
        ? primaryExt.duration * 12
        : primaryExt.unit === 'months'
        ? primaryExt.duration
        : Math.max(1, Math.round(primaryExt.duration / 30))
      : undefined;

    onSave({
      name: name.trim(),
      category,
      brand: brand.trim(),
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice),
      warrantyMonths: warrantyDays !== undefined ? Math.max(0, Math.round(warrantyDays / 30)) : parseInt(warrantyMonths, 10) || 12,
      warrantyDays,
      extendedWarrantyMonths: primaryExtMonths,
      extendedWarrantyComponent: primaryExt ? primaryExt.component.trim() : undefined,
      additionalWarranties: validComponents.length > 0 ? validComponents : undefined,
      storeName: storeName.trim() || undefined,
      modelNumber: modelNumber.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      customerCare: customerCare.trim() || undefined,
      notes: notes.trim() || undefined,
      invoiceImageUrl,
      invoiceFileName,
      warrantyCardImageUrl,
      warrantyCardFileName,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              Add New Household Product
            </h2>
            <p className="text-xs text-slate-500">
              Register an appliance to track warranties, service reminders and purchase receipts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="add-product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <div>
              <label htmlFor="product-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                placeholder="e.g. LG 437L Frost-Free Double Door Smart Refrigerator"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  errors.name ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                } focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-colors text-slate-900 placeholder:text-slate-400`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Category and Brand in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-600 bg-white text-slate-900"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-brand" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-brand"
                  type="text"
                  list="brand-suggestions"
                  placeholder="e.g. LG, Daikin, IFB, Samsung"
                  value={brand}
                  onChange={(e) => {
                    handleBrandChange(e.target.value);
                    if (errors.brand) setErrors((prev) => ({ ...prev, brand: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    errors.brand ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                  } focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400`}
                />
                <datalist id="brand-suggestions">
                  {POPULAR_INDIAN_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                {errors.brand && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.brand}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Purchase Date & Price in INR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-purchase-date" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-purchase-date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value);
                    if (errors.purchaseDate) setErrors((prev) => ({ ...prev, purchaseDate: '' }));
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    errors.purchaseDate ? 'border-red-500' : 'border-slate-300 focus:border-blue-600'
                  } focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white`}
                />
                {errors.purchaseDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.purchaseDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="product-price" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Purchase Price (INR ₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                    ₹
                  </span>
                  <input
                    id="product-price"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 48990"
                    value={purchasePrice}
                    onChange={(e) => {
                      setPurchasePrice(e.target.value);
                      if (errors.purchasePrice) setErrors((prev) => ({ ...prev, purchasePrice: '' }));
                    }}
                    className={`w-full pl-8 pr-3.5 py-2 text-sm rounded-lg border ${
                      errors.purchasePrice ? 'border-red-500 bg-red-50/20' : 'border-slate-300 focus:border-blue-600'
                    } focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 tabular-nums`}
                  />
                </div>
                {errors.purchasePrice && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.purchasePrice}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Warranty Setup */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Warranty Coverage
              </h3>
              {purchaseDate && (
                <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Expires:{' '}
                  {
                    calculateWarranty(
                      purchaseDate,
                      parseInt(warrantyMonths, 10) || 0,
                      undefined,
                      new Date(),
                      warrantyDays
                    ).formattedExpiryDate
                  }
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="warranty-months" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Standard Warranty <span className="text-red-500">*</span>
                </label>
                {/* Quick Presets (Days / Months / Years) + Custom */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: '7d', days: 7, months: '0' },
                    { label: '30d', days: 30, months: '1' },
                    { label: '6m', months: '6' },
                    { label: '1y', months: '12' },
                    { label: '2y', months: '24' },
                    { label: '3y', months: '36' },
                    { label: '5y', months: '60' },
                  ].map((opt) => {
                    const isSelected =
                      !isCustomWarranty &&
                      (opt.days !== undefined
                        ? warrantyDays === opt.days
                        : warrantyDays === undefined && warrantyMonths === opt.months);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          setIsCustomWarranty(false);
                          if (opt.days !== undefined) {
                            setWarrantyDays(opt.days);
                            setWarrantyMonths(opt.months);
                            setWarrantyUnit('days');
                            setWarrantyInputValue(String(opt.days));
                          } else {
                            setWarrantyDays(undefined);
                            setWarrantyMonths(opt.months);
                            setWarrantyUnit('months');
                            setWarrantyInputValue(opt.months);
                          }
                          if (errors.warrantyMonths) setErrors((prev) => ({ ...prev, warrantyMonths: '' }));
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustomWarranty(true)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      isCustomWarranty
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {isCustomWarranty && (
                  <div className="space-y-2 mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <input
                        id="warranty-months"
                        type="number"
                        min="0"
                        max="3650"
                        value={warrantyInputValue}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setWarrantyInputValue(raw);
                          const num = parseInt(raw, 10);
                          if (!isNaN(num) && num >= 0) {
                            if (warrantyUnit === 'days') {
                              setWarrantyDays(num);
                              setWarrantyMonths(String(Math.round(num / 30)));
                            } else if (warrantyUnit === 'years') {
                              setWarrantyDays(undefined);
                              setWarrantyMonths(String(num * 12));
                            } else {
                              setWarrantyDays(undefined);
                              setWarrantyMonths(String(num));
                            }
                            if (errors.warrantyMonths) setErrors((prev) => ({ ...prev, warrantyMonths: '' }));
                          } else {
                            setWarrantyDays(undefined);
                            setWarrantyMonths('');
                          }
                        }}
                        placeholder="e.g. 45"
                        className="w-24 px-2.5 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden"
                      />
                      <select
                        value={warrantyUnit}
                        onChange={(e) => {
                          const nextUnit = e.target.value as WarrantyUnit;
                          setWarrantyUnit(nextUnit);
                          const num = parseInt(warrantyInputValue, 10) || 0;
                          if (nextUnit === 'days') {
                            setWarrantyDays(num);
                            setWarrantyMonths(String(Math.round(num / 30)));
                          } else if (nextUnit === 'years') {
                            setWarrantyDays(undefined);
                            setWarrantyMonths(String(num * 12));
                          } else {
                            setWarrantyDays(undefined);
                            setWarrantyMonths(String(num));
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 shrink-0">Or exact expiry:</span>
                      <input
                        type="date"
                        min={purchaseDate}
                        onChange={(e) => {
                          if (!e.target.value || !purchaseDate) return;
                          const start = new Date(purchaseDate);
                          const end = new Date(e.target.value);
                          const diffDays = Math.max(
                            0,
                            Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                          );
                          setWarrantyUnit('days');
                          setWarrantyInputValue(String(diffDays));
                          setWarrantyDays(diffDays);
                          setWarrantyMonths(String(Math.round(diffDays / 30)));
                        }}
                        className="flex-1 px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-white text-slate-800"
                      />
                    </div>
                  </div>
                )}
                {errors.warrantyMonths && (
                  <p className="text-xs text-red-600 mt-1">{errors.warrantyMonths}</p>
                )}
              </div>

              <div>
                <label htmlFor="store-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Retailer / Store Name
                </label>
                <input
                  id="store-name"
                  type="text"
                  list="store-suggestions"
                  placeholder="e.g. Reliance Digital, Croma, Amazon"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
                />
                <datalist id="store-suggestions">
                  {POPULAR_INDIAN_RETAILERS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Multiple Component Warranties */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasExtendedWarranty}
                  onChange={(e) => setHasExtendedWarranty(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Add Component / Extended Warranties (e.g., Compressor, Motor, PCB, Battery)
                </span>
              </label>

              {hasExtendedWarranty && (
                <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-200">
                  {componentWarranties.map((cw, idx) => {
                    const preview = purchaseDate
                      ? calculateDurationExpiry(purchaseDate, cw.duration || 0, cw.unit)
                      : null;
                    return (
                      <div
                        key={cw.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200"
                      >
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder={`Component #${idx + 1} (e.g. Compressor)`}
                            value={cw.component}
                            onChange={(e) =>
                              setComponentWarranties((prev) =>
                                prev.map((item) =>
                                  item.id === cw.id ? { ...item, component: e.target.value } : item
                                )
                              )
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 focus:border-blue-600 focus:outline-hidden text-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="number"
                            min="1"
                            max="3650"
                            value={cw.duration}
                            onChange={(e) =>
                              setComponentWarranties((prev) =>
                                prev.map((item) =>
                                  item.id === cw.id
                                    ? { ...item, duration: Math.max(0, parseInt(e.target.value, 10) || 0) }
                                    : item
                                )
                              )
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-300 focus:border-blue-600 focus:outline-hidden text-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <select
                            value={cw.unit}
                            onChange={(e) =>
                              setComponentWarranties((prev) =>
                                prev.map((item) =>
                                  item.id === cw.id
                                    ? { ...item, unit: e.target.value as WarrantyUnit }
                                    : item
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden"
                          >
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-1.5">
                          {preview && (
                            <span className="text-[10px] text-slate-500 truncate" title={`Expires ${preview.formattedExpiryDate}`}>
                              {preview.formattedExpiryDate}
                            </span>
                          )}
                          {componentWarranties.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setComponentWarranties((prev) => prev.filter((item) => item.id !== cw.id))
                              }
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Remove component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      setComponentWarranties((prev) => [
                        ...prev,
                        { id: `cw-${Date.now()}-${prev.length}`, component: '', duration: 12, unit: 'months' },
                      ])
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Component Warranty</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Hardware IDs & Notes */}
          <div className="pt-4 border-t border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hardware Details & Helpline (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="model-num" className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Number
                </label>
                <input
                  id="model-num"
                  type="text"
                  placeholder="e.g. GL-T432APZY"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-600 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label htmlFor="serial-num" className="block text-xs font-semibold text-slate-700 mb-1">
                  Serial Number
                </label>
                <input
                  id="serial-num"
                  type="text"
                  placeholder="e.g. LG99210-SN"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-600 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label htmlFor="care-number" className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Care / Helpline
                </label>
                <input
                  id="care-number"
                  type="text"
                  placeholder="e.g. 1800-315-9999"
                  value={customerCare}
                  onChange={(e) => setCustomerCare(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="product-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Purchase Comments
              </label>
              <textarea
                id="product-notes"
                rows={2}
                placeholder="e.g. Includes ₹3,000 credit card cashback. Registered on brand app."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-600 text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 4: Camera & Document Attachments */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Camera &amp; Document Storage</span>
              </h3>
              <span className="text-[11px] text-slate-400">Stores directly to vault</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Invoice Attachment Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Purchase Invoice / GST Bill</span>
                  </span>
                  {invoiceImageUrl && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Attached
                    </span>
                  )}
                </div>

                {invoiceImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white p-1 flex items-center justify-between gap-2">
                    <img
                      src={invoiceImageUrl}
                      alt="Invoice preview"
                      className="w-12 h-12 object-cover rounded bg-slate-100"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="font-semibold text-slate-800 truncate block text-[11px]">
                        {invoiceFileName || 'Invoice_Document.jpg'}
                      </span>
                      <span className="text-[10px] text-slate-400">Ready to store</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceImageUrl(undefined);
                        setInvoiceFileName(undefined);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={invoiceInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressed = await compressImage(file);
                          setInvoiceImageUrl(compressed);
                          setInvoiceFileName(file.name || 'Invoice_Photo.jpg');
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => invoiceInputRef.current?.click()}
                      className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Snap or Upload Invoice</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Warranty Card Attachment */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Physical Warranty Card</span>
                  </span>
                  {warrantyCardImageUrl && (
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Attached
                    </span>
                  )}
                </div>

                {warrantyCardImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white p-1 flex items-center justify-between gap-2">
                    <img
                      src={warrantyCardImageUrl}
                      alt="Warranty preview"
                      className="w-12 h-12 object-cover rounded bg-slate-100"
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="font-semibold text-slate-800 truncate block text-[11px]">
                        {warrantyCardFileName || 'Warranty_Card.jpg'}
                      </span>
                      <span className="text-[10px] text-slate-400">Ready to store</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWarrantyCardImageUrl(undefined);
                        setWarrantyCardFileName(undefined);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remove warranty card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={warrantyInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const compressed = await compressImage(file);
                          setWarrantyCardImageUrl(compressed);
                          setWarrantyCardFileName(file.name || 'Warranty_Card.jpg');
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => warrantyInputRef.current?.click()}
                      className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Snap or Upload Warranty Card</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Pinned Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-product-form"
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Save Product
          </button>
        </div>
      </div>
    </div>
  );
};
