import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  ShieldCheck,
  SwitchCamera,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';
import { compressImage } from '../utils/camera';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  targetProductId?: string;
  defaultDocType?: 'invoice' | 'warranty_card';
  onAttachDocument: (params: {
    productId: string;
    docType: 'invoice' | 'warranty_card';
    dataUrl: string;
    fileName: string;
  }) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  products,
  targetProductId,
  defaultDocType = 'invoice',
  onAttachDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    targetProductId || products[0]?.id || ''
  );
  const [docType, setDocType] = useState<'invoice' | 'warranty_card'>(defaultDocType);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync targetProductId and defaultDocType when opened
  useEffect(() => {
    if (isOpen) {
      if (targetProductId) {
        setSelectedProductId(targetProductId);
      } else if (products.length > 0) {
        setSelectedProductId(products[0].id);
      }
      setDocType(defaultDocType);
      setCapturedPreview(null);
      setCameraError(null);
    }
  }, [isOpen, targetProductId, defaultDocType, products]);

  // Start / stop camera stream
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isOpen && activeTab === 'camera' && !capturedPreview) {
      const startCamera = async () => {
        try {
          setCameraError(null);
          // Try environment (rear) camera first, fall back to user camera
          try {
            currentStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false,
            });
          } catch {
            currentStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }

          setStream(currentStream);
          if (videoRef.current) {
            videoRef.current.srcObject = currentStream;
          }
        } catch (err: any) {
          console.warn('Camera access error:', err);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission was denied. Please allow camera access in your browser or use the file upload option.'
              : 'Could not connect to a camera device. You can upload an invoice image directly.'
          );
        }
      };

      startCamera();
    } else {
      // Clean up stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, activeTab, facingMode, capturedPreview]);

  if (!isOpen) return null;

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const compressed = await compressImage(rawDataUrl, 1024, 1024, 0.75);
        setCapturedPreview(compressed);
      }
    } catch (e) {
      console.error('Error capturing photo:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, 1024, 1024, 0.75);
      setCapturedPreview(compressed);
    } catch (err) {
      console.error('Error processing uploaded file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    if (!capturedPreview || !selectedProductId) return;

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    const prodNameSlug = selectedProduct?.brand || 'Appliance';
    const timeStr = new Date().toISOString().split('T')[0];
    const generatedFileName = `${prodNameSlug}_${docType === 'invoice' ? 'Invoice' : 'Warranty'}_${timeStr}.jpg`;

    onAttachDocument({
      productId: selectedProductId,
      docType,
      dataUrl: capturedPreview,
      fileName: generatedFileName,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="camera-modal-title" className="text-base font-bold text-slate-900">
                Snap &amp; Store Document
              </h2>
              <p className="text-[11px] text-slate-500">
                Capture purchase invoice bill or warranty card using your camera.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Close camera modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Appliance and Document Type Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="target-appliance" className="block text-xs font-semibold text-slate-700 mb-1">
                Link to Appliance
              </label>
              <select
                id="target-appliance"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-hidden"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="document-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Document Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDocType('invoice')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    docType === 'invoice'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice / Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('warranty_card')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                    docType === 'warranty_card'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Warranty Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode Switcher: Live Camera vs Upload File */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => {
                setActiveTab('camera');
                setCapturedPreview(null);
              }}
              className={`text-xs font-medium pb-1.5 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera Snap</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                setCapturedPreview(null);
              }}
              className={`text-xs font-medium pb-1.5 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Bill Photo / File</span>
            </button>
          </div>

          {/* Camera View or Captured Photo Preview */}
          {activeTab === 'camera' && (
            <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800">
              {capturedPreview ? (
                /* Frozen captured photo */
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={capturedPreview}
                    alt="Captured invoice or warranty document"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Photo Captured</span>
                  </div>
                </div>
              ) : cameraError ? (
                /* Camera Error State */
                <div className="p-6 text-center text-slate-300 max-w-sm">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs leading-relaxed mb-4">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image Instead</span>
                  </button>
                </div>
              ) : (
                /* Live Camera Stream */
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Alignment Frame Overlay */}
                  <div className="absolute inset-5 sm:inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                        Align {docType === 'invoice' ? 'GST Invoice / Bill' : 'Warranty Card'}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                        Hold steady &amp; ensure good lighting
                      </span>
                    </div>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 z-10">
                    <button
                      type="button"
                      onClick={handleFlipCamera}
                      className="p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                      title="Flip Camera"
                      aria-label="Switch camera"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCapture}
                      disabled={isProcessing}
                      className="w-14 h-14 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all border-4 border-blue-500/30 cursor-pointer"
                      aria-label="Take photo"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Camera className="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              {capturedPreview ? (
                <div className="relative bg-black rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-200">
                  <img
                    src={capturedPreview}
                    alt="Uploaded preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>File Ready</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    Choose Invoice Photo or PDF
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2">
                    Supports JPG, PNG, and camera photos. Automatically compressed and stored for this appliance.
                  </p>
                  <span className="inline-block px-3 py-1 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs">
                    Browse Files
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            {capturedPreview && (
              <button
                type="button"
                onClick={handleRetake}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retake / Change Photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!capturedPreview}
              className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                capturedPreview
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Store Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
