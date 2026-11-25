import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Store,
  Hash,
  Phone,
  FileText,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Info,
  Camera,
} from 'lucide-react';
import { Product } from '../types';
import { calculateDurationExpiry, calculateWarranty, formatDurationLabel, formatINR, formatDate } from '../utils/formatters';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (product: Product) => void;
  onOpenSnapModal?: (productId: string, docType: 'invoice' | 'warranty_card') => void;
  onOpenViewer?: (doc: {
    title: string;
    productName: string;
    docType: 'invoice' | 'warranty_card';
    imageUrl: string;
    fileName?: string;
  }) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onDelete,
  onOpenSnapModal,
  onOpenViewer,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const warranty = calculateWarranty(
    product.purchaseDate,
    product.warrantyMonths,
    product.extendedWarrantyMonths,
    new Date(),
    product.warrantyDays
  );

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="pr-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-blue-700">{product.brand}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="capitalize">{product.category.replace('_', ' & ')}</span>
            </div>
            <h2 id="detail-title" className="text-lg font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors shrink-0"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warranty Progress Card */}
          <div
            className={`p-4 rounded-xl border ${
              warranty.status === 'active'
                ? 'bg-emerald-50/40 border-emerald-200/70'
                : warranty.status === 'expiring_soon'
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {warranty.status === 'active' && (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
                {warranty.status === 'expiring_soon' && (
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                )}
                {warranty.status === 'expired' && (
                  <ShieldAlert className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-sm font-bold text-slate-900">
                  {warranty.status === 'active' && 'Standard Warranty Active'}
                  {warranty.status === 'expiring_soon' && 'Warranty Expiring Soon'}
                  {warranty.status === 'expired' && 'Standard Warranty Expired'}
                </span>
              </div>

              <span className="text-xs font-semibold tabular-nums text-slate-700">
                {warranty.daysRemaining > 0
                  ? `${warranty.daysRemaining} days remaining`
                  : warranty.daysRemaining === 0
                  ? 'Expires today'
                  : `Expired ${Math.abs(warranty.daysRemaining)} days ago`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-500 ${
                  warranty.status === 'active'
                    ? 'bg-emerald-500'
                    : warranty.status === 'expiring_soon'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                style={{ width: `${warranty.percentageElapsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Purchased: {formatDate(product.purchaseDate)}</span>
              <span>Expires: {warranty.formattedExpiryDate}</span>
            </div>

            {/* Component / Extended warranty notes */}
            {product.additionalWarranties && product.additionalWarranties.length > 0 ? (
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1.5">
                {product.additionalWarranties.map((cw) => {
                  const exp = calculateDurationExpiry(product.purchaseDate, cw.duration, cw.unit);
                  return (
                    <div key={cw.id} className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-medium text-blue-900">{cw.component}:</span>
                      <span className="font-semibold text-blue-800">
                        {formatDurationLabel(cw.duration, cw.unit)} (until {exp.formattedExpiryDate})
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              product.extendedWarrantyMonths && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium text-blue-900">
                    Extended {product.extendedWarrantyComponent || 'Component'}:
                  </span>
                  <span className="font-semibold text-blue-800">
                    {Math.round(product.extendedWarrantyMonths / 12)} Yrs (until {warranty.extendedExpiryDate})
                  </span>
                </div>
              )
            )}
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block mb-1">Purchase Price</span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {formatINR(product.purchasePrice)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block mb-1">Retailer / Store</span>
              <span className="text-sm font-semibold text-slate-800 truncate block">
                {product.storeName || 'Not specified'}
              </span>
            </div>

            {product.modelNumber && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Model Number</span>
                  <button
                    onClick={() => handleCopy(product.modelNumber!, 'model')}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy Model Number"
                  >
                    {copiedField === 'model' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-800 truncate block">
                  {product.modelNumber}
                </span>
              </div>
            )}

            {product.serialNumber && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Serial Number</span>
                  <button
                    onClick={() => handleCopy(product.serialNumber!, 'serial')}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy Serial Number"
                  >
                    {copiedField === 'serial' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-800 truncate block">
                  {product.serialNumber}
                </span>
              </div>
            )}
          </div>

          {/* Customer Care / Service Contact */}
          {product.customerCare && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-blue-900 font-semibold block">
                    {product.brand} Customer Care Helpline
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-950">
                    {product.customerCare}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(product.customerCare!, 'care')}
                className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-100/60 rounded-md border border-blue-200 transition-colors flex items-center gap-1"
              >
                {copiedField === 'care' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
          )}

          {/* Notes */}
          {product.notes && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Household Notes</span>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                {product.notes}
              </div>
            </div>
          )}

          {/* Attached Documents Section (Invoices & Warranties) */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">
              Stored Invoices &amp; Warranty Cards
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Invoice Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Purchase Invoice</span>
                  </span>
                  {product.invoiceImageUrl ? (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Stored
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Missing</span>
                  )}
                </div>

                {product.invoiceImageUrl ? (
                  <div className="space-y-2">
                    <div
                      onClick={() =>
                        onOpenViewer?.({
                          title: `${product.brand} Purchase Invoice`,
                          productName: product.name,
                          docType: 'invoice',
                          imageUrl: product.invoiceImageUrl!,
                          fileName: product.invoiceFileName,
                        })
                      }
                      className="group/img relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-16/10 cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={product.invoiceImageUrl}
                        alt="Invoice thumbnail"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Full Screen</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[130px] font-mono">
                        {product.invoiceFileName || 'GST_Invoice.jpg'}
                      </span>
                      <button
                        onClick={() =>
                          onOpenViewer?.({
                            title: `${product.brand} Purchase Invoice`,
                            productName: product.name,
                            docType: 'invoice',
                            imageUrl: product.invoiceImageUrl!,
                            fileName: product.invoiceFileName,
                          })
                        }
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSnapModal?.(product.id, 'invoice');
                    }}
                    className="w-full py-3 px-2 border border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Snap / Attach Invoice</span>
                  </button>
                )}
              </div>

              {/* Warranty Card Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Warranty Card</span>
                  </span>
                  {product.warrantyCardImageUrl ? (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Stored
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Missing</span>
                  )}
                </div>

                {product.warrantyCardImageUrl ? (
                  <div className="space-y-2">
                    <div
                      onClick={() =>
                        onOpenViewer?.({
                          title: `${product.brand} Warranty Card`,
                          productName: product.name,
                          docType: 'warranty_card',
                          imageUrl: product.warrantyCardImageUrl!,
                          fileName: product.warrantyCardFileName,
                        })
                      }
                      className="group/img relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-16/10 cursor-pointer flex items-center justify-center"
                    >
                      <img
                        src={product.warrantyCardImageUrl}
                        alt="Warranty card thumbnail"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Full Screen</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[130px] font-mono">
                        {product.warrantyCardFileName || 'Warranty_Card.jpg'}
                      </span>
                      <button
                        onClick={() =>
                          onOpenViewer?.({
                            title: `${product.brand} Warranty Card`,
                            productName: product.name,
                            docType: 'warranty_card',
                            imageUrl: product.warrantyCardImageUrl!,
                            fileName: product.warrantyCardFileName,
                          })
                        }
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSnapModal?.(product.id, 'warranty_card');
                    }}
                    className="w-full py-3 px-2 border border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>Snap / Attach Card</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={() => {
              onClose();
              onDelete(product);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Product</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
