import React from 'react';
import { Menu, Plus, Search, Camera, LogOut, User } from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenSidebar: () => void;
  onOpenAddModal: () => void;
  onOpenCamera: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNavigateToProducts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenSidebar,
  onOpenAddModal,
  onOpenCamera,
  searchQuery,
  setSearchQuery,
  onNavigateToProducts,
}) => {
  const { user, logout } = useAuth();

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of appliances, active warranties, and maintenance',
    },
    products: {
      title: 'Household Products',
      subtitle: 'Catalogue of all registered home appliances and gadgets',
    },
    warranties: {
      title: 'Warranty Centre',
      subtitle: 'Coverage status, expiration alerts, and claim guidelines',
    },
    invoices: {
      title: 'Invoice Vault',
      subtitle: 'Digital invoice depository and purchase receipts',
    },
    services: {
      title: 'Service & Maintenance',
      subtitle: 'Repairs, filter replacements, and scheduled maintenance',
    },
  };

  const current = titles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Menu + Page Context */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-400 dark:text-slate-500">HomeVault</span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-700 dark:text-slate-200 capitalize font-medium">{activeTab}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {current.title}
            </h1>
          </div>
        </div>

        {/* Right: Search, Camera, Add Product, Theme, User & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search */}
          <div className="relative hidden md:block w-44 lg:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search appliances..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'products') {
                  onNavigateToProducts();
                }
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Camera Action */}
          <button
            onClick={onOpenCamera}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 active:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Snap Invoice or Warranty Card with Camera"
          >
            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Snap Document</span>
          </button>

          {/* Add Product */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* User badge & Logout (visible when logged in) */}
          {user && (
            <div className="flex items-center gap-2 pl-1.5 border-l border-slate-200 dark:border-slate-700">
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[160px]"
                title={user.email}
              >
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 active:bg-red-100 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 font-medium text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-colors whitespace-nowrap cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
