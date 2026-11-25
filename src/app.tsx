import React, { useState, useEffect, useRef } from 'react';
import { Product, ServiceRecord, ActiveTab, ProductCategory, ComponentWarranty } from './types';
import { INITIAL_PRODUCTS, INITIAL_SERVICE_RECORDS, DEMO_SEED_PRODUCTS, DEMO_SEED_SERVICES } from './data/sampleData';
import { calculateWarranty } from './utils/formatters';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { WarrantyCentreView } from './components/WarrantyCentreView';
import { InvoiceVaultView } from './components/InvoiceVaultView';
import { ServiceHistoryView } from './components/ServiceHistoryView';
import { AddProductModal } from './components/AddProductModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search state (shared with header and products view)
  const [searchQuery, setSearchQuery] = useState('');

  // Products state with local storage persistence (purges old mock dummy IDs)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('homevault_products_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out the old mock items if present so user gets a real clean vault
          const realOnly = parsed.filter(
            (p) => !['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5'].includes(p.id)
          );
          return realOnly;
        }
      }
    } catch (e) {
      console.error('Error reading products from localStorage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Services state with local storage persistence
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => {
    try {
      const stored = localStorage.getItem('homevault_services_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter(
            (s) => !['srv-1', 'srv-2', 'srv-3'].includes(s.id)
          );
          return realOnly;
        }
      }
    } catch (e) {
      console.error('Error reading service records from localStorage:', e);
    }
    return INITIAL_SERVICE_RECORDS;
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addProductPreset, setAddProductPreset] = useState<{
    category?: ProductCategory;
    name?: string;
    warrantyMonths?: string;
    hasExtendedWarranty?: boolean;
    extendedComponent?: string;
    extendedMonths?: string;
  } | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState<Product | null>(null);

  // Camera Capture Modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTargetProductId, setCameraTargetProductId] = useState<string | undefined>();
  const [cameraDocType, setCameraDocType] = useState<'invoice' | 'warranty_card'>('invoice');

  // Document Viewer Modal state
  const [viewerDocument, setViewerDocument] = useState<{
    title: string;
    productName: string;
    docType: 'invoice' | 'warranty_card';
    imageUrl: string;
    fileName?: string;
  } | null>(null);

  // Hidden file input ref for backup restoration
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync products to local storage
  useEffect(() => {
    try {
      localStorage.setItem('homevault_products_v1', JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products to localStorage:', e);
    }
  }, [products]);

  // Sync service records to local storage
  useEffect(() => {
    try {
      localStorage.setItem('homevault_services_v1', JSON.stringify(serviceRecords));
    } catch (e) {
      console.error('Error saving services to localStorage:', e);
    }
  }, [serviceRecords]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Open Add Product Modal with optional preset
  const handleOpenAddModal = (preset?: typeof addProductPreset) => {
    setAddProductPreset(preset || null);
    setIsAddModalOpen(true);
  };

  // Export JSON backup for genuine data preservation
  const handleExportBackup = () => {
    const backupData = {
      appName: 'HomeVault India',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      productsCount: products.length,
      products,
      serviceRecords,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homevault-household-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Household backup JSON downloaded.');
  };

  // Restore backup from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.products)) {
          setProducts(parsed.products);
          if (Array.isArray(parsed.serviceRecords)) {
            setServiceRecords(parsed.serviceRecords);
          }
          showToast(`Successfully restored ${parsed.products.length} appliances.`);
        } else {
          showToast('Invalid HomeVault backup file format.');
        }
      } catch (err) {
        console.error('Backup restore failed:', err);
        showToast('Error reading backup file.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Optional preview demo data loader
  const handleLoadDemoData = () => {
    setProducts(DEMO_SEED_PRODUCTS);
    setServiceRecords(DEMO_SEED_SERVICES);
    showToast('Loaded demo appliances. You can delete or replace them anytime.');
  };
  const handleSaveProduct = (newProductData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);
    showToast(`"${newProduct.name}" saved to HomeVault.`);
  };

  // Delete product handler
  const handleConfirmDelete = () => {
    if (!selectedProductForDelete) return;
    const name = selectedProductForDelete.name;
    setProducts((prev) => prev.filter((p) => p.id !== selectedProductForDelete.id));
    // Also remove associated service records
    setServiceRecords((prev) => prev.filter((s) => s.productId !== selectedProductForDelete.id));
    setSelectedProductForDelete(null);
    showToast(`Removed "${name}" from vault.`);
  };

  // Update product warranty handler
  const handleUpdateProductWarranty = (
    productId: string,
    warrantyMonths: number,
    extendedWarrantyMonths?: number,
    extendedWarrantyComponent?: string,
    warrantyDays?: number,
    additionalWarranties?: ComponentWarranty[]
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              warrantyMonths,
              warrantyDays,
              extendedWarrantyMonths,
              extendedWarrantyComponent,
              additionalWarranties,
            }
          : p
      )
    );
    showToast('Warranty coverage updated.');
  };

  // Add service record handler
  const handleAddServiceRecord = (recordData: Omit<ServiceRecord, 'id'>) => {
    const newRecord: ServiceRecord = {
      ...recordData,
      id: `srv-${Date.now()}`,
    };
    setServiceRecords((prev) => [newRecord, ...prev]);
    showToast(`Service record logged for ${newRecord.productName}.`);
  };

  // Open camera modal helper
  const handleOpenLiveCamera = (productId?: string, docType: 'invoice' | 'warranty_card' = 'invoice') => {
    setCameraTargetProductId(productId);
    setCameraDocType(docType);
    setIsCameraModalOpen(true);
  };

  // Attach captured camera document to product
  const handleAttachDocument = ({
    productId,
    docType,
    dataUrl,
    fileName,
  }: {
    productId: string;
    docType: 'invoice' | 'warranty_card';
    dataUrl: string;
    fileName: string;
  }) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (docType === 'invoice') {
          return {
            ...p,
            invoiceImageUrl: dataUrl,
            invoiceFileName: fileName,
          };
        } else {
          return {
            ...p,
            warrantyCardImageUrl: dataUrl,
            warrantyCardFileName: fileName,
          };
        }
      })
    );

    // Also update selectedProductForDetail if currently open
    setSelectedProductForDetail((prev) => {
      if (!prev || prev.id !== productId) return prev;
      if (docType === 'invoice') {
        return { ...prev, invoiceImageUrl: dataUrl, invoiceFileName: fileName };
      } else {
        return { ...prev, warrantyCardImageUrl: dataUrl, warrantyCardFileName: fileName };
      }
    });

    const targetProd = products.find((p) => p.id === productId);
    showToast(
      `${docType === 'invoice' ? 'Invoice bill' : 'Warranty card'} saved for ${targetProd?.name || 'appliance'}.`
    );
  };

  // Compute metrics for navigation badges
  const expiringCount = products.filter((p) => {
    const w = calculateWarranty(p.purchaseDate, p.warrantyMonths, p.extendedWarrantyMonths, new Date(), p.warrantyDays);
    return w.status === 'expiring_soon';
  }).length;

  const invoiceCount = products.filter((p) => Boolean(p.invoiceImageUrl)).length;
  const serviceCount = serviceRecords.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row antialiased text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Hidden file input for backup restore */}
      <input
        ref={backupInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportBackup}
        className="hidden"
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        productCount={products.length}
        expiringCount={expiringCount}
        invoiceCount={invoiceCount}
        serviceCount={serviceCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onExportBackup={handleExportBackup}
        onImportBackup={() => backupInputRef.current?.click()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAddModal={() => handleOpenAddModal()}
          onOpenCamera={() => handleOpenLiveCamera()}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNavigateToProducts={() => setActiveTab('products')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              serviceRecords={serviceRecords}
              onOpenAddModal={handleOpenAddModal}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onViewProduct={(product) => setSelectedProductForDetail(product)}
              onDeleteProduct={(product) => setSelectedProductForDelete(product)}
              onOpenCamera={() => handleOpenLiveCamera()}
              onLoadDemoData={handleLoadDemoData}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              onOpenAddModal={() => handleOpenAddModal()}
              onViewProduct={(product) => setSelectedProductForDetail(product)}
              onDeleteProduct={(product) => setSelectedProductForDelete(product)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {activeTab === 'warranties' && (
            <WarrantyCentreView
              products={products}
              onViewProduct={(product) => setSelectedProductForDetail(product)}
              onOpenAddModal={() => handleOpenAddModal()}
              onUpdateWarranty={handleUpdateProductWarranty}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoiceVaultView
              products={products}
              onViewProduct={(product) => setSelectedProductForDetail(product)}
              onOpenAddModal={() => handleOpenAddModal()}
              onOpenCamera={(prodId) => handleOpenLiveCamera(prodId, 'invoice')}
              onOpenViewer={(doc) => setViewerDocument(doc)}
            />
          )}

          {activeTab === 'services' && (
            <ServiceHistoryView
              products={products}
              serviceRecords={serviceRecords}
              onAddServiceRecord={handleAddServiceRecord}
              onOpenAddModal={() => handleOpenAddModal()}
            />
          )}
        </main>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddProductPreset(null);
        }}
        onSave={handleSaveProduct}
        initialPreset={addProductPreset}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        products={products}
        targetProductId={cameraTargetProductId}
        defaultDocType={cameraDocType}
        onAttachDocument={handleAttachDocument}
      />

      {/* Full Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(viewerDocument)}
        onClose={() => setViewerDocument(null)}
        document={viewerDocument}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        onDelete={(prod) => {
          setSelectedProductForDetail(null);
          setSelectedProductForDelete(prod);
        }}
        onOpenSnapModal={(prodId, docType) => handleOpenLiveCamera(prodId, docType)}
        onOpenViewer={(doc) => setViewerDocument(doc)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        product={selectedProductForDelete}
        isOpen={Boolean(selectedProductForDelete)}
        onClose={() => setSelectedProductForDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
