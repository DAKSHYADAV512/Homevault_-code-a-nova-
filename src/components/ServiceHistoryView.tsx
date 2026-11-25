import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Droplets,
  AirVent,
  Shirt,
  DollarSign,
  AlertCircle,
  X
} from 'lucide-react';
import { Product, ServiceRecord } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface ServiceHistoryViewProps {
  products: Product[];
  serviceRecords: ServiceRecord[];
  onAddServiceRecord: (record: Omit<ServiceRecord, 'id'>) => void;
  onOpenAddModal: () => void;
}

export const ServiceHistoryView: React.FC<ServiceHistoryViewProps> = ({
  products,
  serviceRecords,
  onAddServiceRecord,
  onOpenAddModal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState<ServiceRecord['serviceType']>('routine');
  const [cost, setCost] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  // Total maintenance spend
  const totalSpend = serviceRecords.reduce((acc, r) => acc + (r.cost || 0), 0);

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === selectedProductId);
    if (!product || !description.trim()) return;

    onAddServiceRecord({
      productId: product.id,
      productName: product.name,
      serviceDate,
      serviceType,
      cost: parseFloat(cost) || 0,
      provider: provider.trim() || `${product.brand} Service Engineer`,
      description: description.trim(),
      nextDueDate: nextDueDate || undefined,
    });

    setIsAddModalOpen(false);
    setDescription('');
    setCost('');
    setProvider('');
    setNextDueDate('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner & Spend Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-gradient-to-r from-slate-900 to-[#101D42] text-white p-6 sm:p-7 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>Repairs & Preventative Care</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1.5">
              Household Service History
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Keep an auditable maintenance diary for your air conditioners, water purifiers, washing machines and electronics. Prevent costly breakdowns with timely routine servicing.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Service Record</span>
            </button>
          </div>
        </div>

        {/* Spend Stat Box */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Total Maintenance Spend
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {formatINR(totalSpend)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across <strong className="text-slate-800">{serviceRecords.length}</strong> logged maintenance events
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Free / In-Warranty Services</span>
            <span className="font-semibold text-emerald-600">
              {serviceRecords.filter((s) => s.cost === 0).length} records
            </span>
          </div>
        </div>
      </div>

      {/* Service Records Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Logged Maintenance Events ({serviceRecords.length})
            </h3>
            <p className="text-xs text-slate-500">
              Service visits, filter replacements, repairs, and annual check-ups.
            </p>
          </div>
        </div>

        {serviceRecords.length > 0 ? (
          <div className="space-y-3">
            {serviceRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">
                      {record.productName}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500 capitalize">
                      {record.serviceType.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-500">
                      Service Date: <strong className="text-slate-700">{formatDate(record.serviceDate)}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {record.description}
                  </p>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                    <span>Technician / Centre: <strong className="text-slate-700">{record.provider}</strong></span>
                    {record.nextDueDate && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-blue-700 font-medium">
                          Next Due: {formatDate(record.nextDueDate)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-[11px] text-slate-400 block">Service Cost</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {record.cost === 0 ? (
                      <span className="text-emerald-600 font-semibold">Free (Under Warranty)</span>
                    ) : (
                      formatINR(record.cost)
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-xs text-slate-500 mb-3">No service records logged yet.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Log First Maintenance Record
            </button>
          </div>
        )}
      </div>

      {/* Preventative Maintenance Schedule for Indian Households */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Recommended Indian Household Maintenance Cadence</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 mt-3">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <AirVent className="w-3.5 h-3.5 text-blue-600" />
              <span>Split AC (Every March)</span>
            </div>
            <span>Deep chemical wet wash and jet pump coil cleaning before peak Indian summer heatwaves.</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>RO Purifier (Every 6 Months)</span>
            </div>
            <span>Replace sediment candle and carbon block to protect the expensive RO membrane from high TDS water.</span>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <Shirt className="w-3.5 h-3.5 text-blue-600" />
              <span>Washing Machine (Quarterly)</span>
            </div>
            <span>Run Tub Clean cycle using citric acid or descaling powder to remove hard water calcium build-up.</span>
          </div>
        </div>
      </div>

      {/* Add Service Record Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Log Appliance Maintenance
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {products.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven&apos;t added any appliances to your HomeVault yet. Please register your refrigerator, AC, or washing machine first, then log its service record.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    onOpenAddModal();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Add Your First Appliance
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateService} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Appliance *
                  </label>
                  <select
                    value={selectedProductId || products[0]?.id || ''}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand})
                      </option>
                    ))}
                  </select>
                </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Date *
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  >
                    <option value="routine">Routine Check-Up / Clean</option>
                    <option value="filter_replacement">Filter / Candle Replacement</option>
                    <option value="repair">Breakdown Repair</option>
                    <option value="installation">Installation / Setup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost in INR (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 if free"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Service Provider / Center
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Authorized Brand Care"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Work Description *
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Jet pump coil wash, filter replacement, cooling gas top-up."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Scheduled Service Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white"
                />
              </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
