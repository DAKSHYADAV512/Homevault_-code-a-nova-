import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  FileText,
  Wrench,
  Shield,
  X,
  Database,
  ArrowRight
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  productCount: number;
  expiringCount: number;
  invoiceCount: number;
  serviceCount: number;
  isOpen: boolean;
  onClose: () => void;
  onExportBackup?: () => void;
  onImportBackup?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  productCount,
  expiringCount,
  invoiceCount,
  serviceCount,
  isOpen,
  onClose,
  onExportBackup,
  onImportBackup,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'products' as ActiveTab,
      label: 'Products',
      icon: Package,
      badge: productCount > 0 ? String(productCount) : null,
    },
    {
      id: 'warranties' as ActiveTab,
      label: 'Warranty Centre',
      icon: ShieldCheck,
      badge: expiringCount > 0 ? `${expiringCount} due` : null,
      badgeVariant: expiringCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'invoices' as ActiveTab,
      label: 'Invoice Vault',
      icon: FileText,
      badge: invoiceCount > 0 ? `${invoiceCount} bills` : null,
      badgeVariant: 'neutral',
    },
    {
      id: 'services' as ActiveTab,
      label: 'Service History',
      icon: Wrench,
      badge: serviceCount > 0 ? `${serviceCount} logs` : null,
      badgeVariant: 'neutral',
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B132B] text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">HomeVault</span>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal truncate max-w-[170px]">
                Indian Household Asset Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tagline Banner */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800/60">
          <p className="text-[11px] text-slate-400 italic leading-relaxed">
            &ldquo;Everything your home owns. Nothing your home forgets.&rdquo;
          </p>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3 pb-2 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                      item.badgeVariant === 'warning'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : item.badgeVariant === 'info'
                        ? 'bg-slate-800 text-slate-400 text-[10px]'
                        : isActive
                        ? 'bg-blue-500/40 text-blue-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Household Info & Data Controls */}
        <div className="p-4 m-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-1.5 text-slate-300 font-semibold">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Private Household Vault</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal mb-3">
            Your bills, warranties and appliance records are saved securely on your device.
          </p>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            {onExportBackup && (
              <button
                onClick={onExportBackup}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 text-[11px] font-medium text-slate-200 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                title="Download JSON backup of all purchases & bills"
              >
                <span>Backup JSON</span>
              </button>
            )}
            {onImportBackup && (
              <button
                onClick={onImportBackup}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 text-[11px] font-medium text-slate-200 rounded-md transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
                title="Restore purchases from JSON backup file"
              >
                <span>Restore</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>HomeVault India</span>
          <span className="text-slate-400">100% Private</span>
        </div>
      </aside>
    </>
  );
};
