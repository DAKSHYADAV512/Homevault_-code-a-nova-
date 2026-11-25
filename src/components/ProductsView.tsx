import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Boxes,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Product, ProductCategory, WarrantyStatus } from '../types';
import { calculateWarranty, CATEGORY_OPTIONS } from '../utils/formatters';
import { ProductCard } from './ProductCard';

interface ProductsViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onOpenAddModal,
  onViewProduct,
  onDeleteProduct,
  searchQuery,
  setSearchQuery,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [warrantyFilter, setWarrantyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'expiry'>('newest');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesModel = p.modelNumber?.toLowerCase().includes(q) || false;
        const matchesStore = p.storeName?.toLowerCase().includes(q) || false;
        const matchesNotes = p.notes?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesBrand && !matchesModel && !matchesStore && !matchesNotes) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Warranty filter
      if (warrantyFilter !== 'all') {
        const w = calculateWarranty(p.purchaseDate, p.warrantyMonths, p.extendedWarrantyMonths);
        if (warrantyFilter === 'active' && w.status !== 'active') return false;
        if (warrantyFilter === 'expiring_soon' && w.status !== 'expiring_soon') return false;
        if (warrantyFilter === 'expired' && w.status !== 'expired') return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'price_desc') {
        return (b.purchasePrice || 0) - (a.purchasePrice || 0);
      }
      if (sortBy === 'price_asc') {
        return (a.purchasePrice || 0) - (b.purchasePrice || 0);
      }
      if (sortBy === 'expiry') {
        const wA = calculateWarranty(a.purchaseDate, a.warrantyMonths);
        const wB = calculateWarranty(b.purchaseDate, b.warrantyMonths);
        return wA.daysRemaining - wB.daysRemaining;
      }
      return 0;
    });
  }, [products, searchQuery, selectedCategory, warrantyFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setWarrantyFilter('all');
    setSortBy('newest');
  };

  const isFiltering = searchQuery.trim() !== '' || selectedCategory !== 'all' || warrantyFilter !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search appliances by name, brand, model, or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selection & Add Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:outline-hidden"
                aria-label="Sort products"
              >
                <option value="newest">Recently Added</option>
                <option value="oldest">Oldest Added</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="expiry">Warranty Expiry</option>
              </select>
            </div>

            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Interactive Segmented Buttons) */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Category Pills/Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              All Categories ({products.length})
            </button>
            {CATEGORY_OPTIONS.map((cat) => {
              const count = products.filter((p) => p.category === cat.id).length;
              if (count === 0 && selectedCategory !== cat.id) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Warranty Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Warranty:</span>
            <button
              onClick={() => setWarrantyFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                warrantyFilter === 'all'
                  ? 'bg-slate-200 text-slate-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setWarrantyFilter('active')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                warrantyFilter === 'active'
                  ? 'bg-emerald-100 text-emerald-800 font-semibold'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setWarrantyFilter('expiring_soon')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                warrantyFilter === 'expiring_soon'
                  ? 'bg-amber-100 text-amber-800 font-semibold'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => setWarrantyFilter('expired')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                warrantyFilter === 'expired'
                  ? 'bg-slate-300 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      {/* Results Count & Reset Filter banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800 tabular-nums">{filteredProducts.length}</strong> of{' '}
          <strong className="text-slate-800 tabular-nums">{products.length}</strong> registered household appliances
        </span>
        {isFiltering && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewProduct}
              onDelete={onDeleteProduct}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto shadow-2xs">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Boxes className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {isFiltering ? 'No matching appliances found' : 'Your HomeVault is empty'}
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {isFiltering
              ? 'Try adjusting your search terms or category filter to find the appliances you are looking for.'
              : 'Add your refrigerator, air conditioner, washing machine, TV or laptop to start tracking warranties and maintenance.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {isFiltering ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : null}
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add First Appliance</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

