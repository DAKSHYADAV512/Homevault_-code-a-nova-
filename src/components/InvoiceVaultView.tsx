import React from 'react';
import {
  FileText,
  Camera,
  Upload,
  Cloud,
  CheckCircle,
  Database,
  ArrowRight,
  ExternalLink,
  Receipt,
  FileCheck,
  Shield,
  Layers,
  Sparkles,
  Eye,
  Plus
} from 'lucide-react';
import { Product } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface InvoiceVaultViewProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onOpenAddModal: () => void;
  onOpenCamera: (productId?: string) => void;
  onOpenViewer: (doc: {
    title: string;
    productName: string;
    docType: 'invoice' | 'warranty_card';
    imageUrl: string;
    fileName?: string;
  }) => void;
}

export const InvoiceVaultView: React.FC<InvoiceVaultViewProps> = ({
  products,
  onViewProduct,
  onOpenAddModal,
  onOpenCamera,
  onOpenViewer,
}) => {
  const productsWithInvoices = products.filter((p) => p.invoiceImageUrl);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner & Primary Camera CTA */}
      <div className="bg-gradient-to-br from-slate-900 to-[#101D42] text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Camera Scanner &amp; Document Store</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Invoice &amp; Bill Vault
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Snap photos of purchase invoices, cash memos and GST tax bills with your device camera. HomeVault compresses and stores them locally on your device for immediate warranty and insurance claims.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenCamera()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Snap Invoice with Camera</span>
            </button>
            <button
              onClick={() => onOpenCamera()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium rounded-lg border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Bill Photo</span>
            </button>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 hidden lg:block pointer-events-none">
          <Receipt className="w-64 h-64 text-blue-400" />
        </div>
      </div>

      {/* Visual Invoice Gallery (Cards with Previews) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Attached Invoices &amp; Bills ({productsWithInvoices.length})
            </h3>
            <p className="text-xs text-slate-500">
              Direct photo captures and digital receipts stored in your HomeVault.
            </p>
          </div>
          <button
            onClick={() => onOpenCamera()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Invoice</span>
          </button>
        </div>

        {productsWithInvoices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productsWithInvoices.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all p-4 flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div
                    onClick={() =>
                      onOpenViewer({
                        title: `${product.brand} Purchase Invoice`,
                        productName: product.name,
                        docType: 'invoice',
                        imageUrl: product.invoiceImageUrl!,
                        fileName: product.invoiceFileName,
                      })
                    }
                    className="relative aspect-16/10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 mb-3 cursor-pointer flex items-center justify-center"
                  >
                    <img
                      src={product.invoiceImageUrl}
                      alt={`${product.name} invoice`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Click to Inspect</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-blue-700">{product.brand}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span>{product.storeName || 'Dealer'}</span>
                  </div>

                  <h4
                    onClick={() => onViewProduct(product)}
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate"
                    title={product.name}
                  >
                    {product.name}
                  </h4>

                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Date: {formatDate(product.purchaseDate)}</span>
                    <span className="font-mono text-slate-600">
                      {product.invoiceNumber || 'INV-VERIFIED'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatINR(product.purchasePrice)}
                  </span>
                  <button
                    onClick={() =>
                      onOpenViewer({
                        title: `${product.brand} Purchase Invoice`,
                        productName: product.name,
                        docType: 'invoice',
                        imageUrl: product.invoiceImageUrl!,
                        fileName: product.invoiceFileName,
                      })
                    }
                    className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Bill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center max-w-md mx-auto">
            <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 mb-1">No Invoices Captured Yet</h4>
            <p className="text-xs text-slate-500 mb-4">
              Take a photo of your receipt or tax invoice with your camera to store it with your appliance.
            </p>
            <button
              onClick={() => onOpenCamera()}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>Snap First Invoice</span>
            </button>
          </div>
        )}
      </div>

      {/* Complete Table of All Appliances & Invoice Attachment Status */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Household Purchase Ledger ({products.length})
          </h3>
          <p className="text-xs text-slate-500">
            Audit and attach missing bills to registered household products.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Appliance</th>
                  <th className="py-3 px-4 font-semibold">Dealer / Store</th>
                  <th className="py-3 px-4 font-semibold">Purchase Date</th>
                  <th className="py-3 px-4 font-semibold">Invoice / Bill #</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                  <th className="py-3 px-4 font-semibold text-center">Invoice Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No appliances logged in the purchase ledger yet. Add an appliance to attach its invoice bill.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td
                        onClick={() => onViewProduct(product)}
                        className="py-3 px-4 font-medium text-slate-900 cursor-pointer"
                      >
                        <div className="font-semibold text-slate-900 truncate max-w-xs hover:text-blue-600">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {product.brand} · {product.category.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {product.storeName || 'Authorized Dealer'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {formatDate(product.purchaseDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-mono">
                        {product.invoiceNumber || `INV-${product.brand.toUpperCase()}-${product.purchaseDate.replace(/-/g, '')}`}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        {formatINR(product.purchasePrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {product.invoiceImageUrl ? (
                          <button
                            onClick={() =>
                              onOpenViewer({
                                title: `${product.brand} Purchase Invoice`,
                                productName: product.name,
                                docType: 'invoice',
                                imageUrl: product.invoiceImageUrl!,
                                fileName: product.invoiceFileName,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Photo</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenCamera(product.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Snap Bill</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
