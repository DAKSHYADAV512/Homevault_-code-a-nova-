import React from 'react';
import { X, Download, FileText, ShieldCheck } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    title: string;
    productName: string;
    docType: 'invoice' | 'warranty_card';
    imageUrl: string;
    fileName?: string;
    date?: string;
  } | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  if (!isOpen || !document) return null;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.imageUrl;
    link.download = document.fileName || `${document.docType}_${Date.now()}.jpg`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              {document.docType === 'invoice' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 id="doc-viewer-title" className="text-base font-bold text-slate-900 leading-snug">
                {document.title}
              </h2>
              <p className="text-xs text-slate-500">
                {document.productName} · {document.docType === 'invoice' ? 'Purchase Invoice / GST Bill' : 'Warranty Card'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Download Document"
              aria-label="Download image document"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Close document viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Display Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-900 flex items-center justify-center min-h-[350px]">
          <img
            src={document.imageUrl}
            alt={`${document.title} document`}
            className="max-h-[70vh] max-w-full rounded-lg shadow-lg object-contain bg-white"
          />
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>Stored in HomeVault Local Storage</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
