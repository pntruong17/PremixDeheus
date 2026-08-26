'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, RefreshCw, ZoomIn, ZoomOut, AlertCircle, CheckCircle, Info, Layers, Check } from 'lucide-react';
import { PremixItem, PremixHandoverRow } from '../types';
import { analyzeWeighingImage } from '../lib/gemini';

interface ImageScannerProps {
  premixCatalog: PremixItem[];
  currentRows: PremixHandoverRow[];
  customApiKey?: string;
  onUpdateFromDualScales: (
    shrimpRecords?: any[],
    fishRecords?: any[],
    shiftInfoDetected?: any
  ) => void;
  onOpenSettings: () => void;
}

export const ImageScanner: React.FC<ImageScannerProps> = ({
  premixCatalog,
  currentRows,
  customApiKey,
  onUpdateFromDualScales,
  onOpenSettings,
}) => {
  // State cho Cân Tháp Cám Tôm
  const [shrimpImage, setShrimpImage] = useState<string | null>(null);
  const [isAnalyzingShrimp, setIsAnalyzingShrimp] = useState(false);
  const [shrimpParsedCount, setShrimpParsedCount] = useState<number | null>(null);

  // State cho Cân Tháp Cám Cá
  const [fishImage, setFishImage] = useState<string | null>(null);
  const [isAnalyzingFish, setIsAnalyzingFish] = useState(false);
  const [fishParsedCount, setFishParsedCount] = useState<number | null>(null);

  // State chung
  const [isAnalyzingBoth, setIsAnalyzingBoth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const shrimpFileRef = useRef<HTMLInputElement>(null);
  const shrimpCamRef = useRef<HTMLInputElement>(null);
  const fishFileRef = useRef<HTMLInputElement>(null);
  const fishCamRef = useRef<HTMLInputElement>(null);

  // Xử lý nạp file cho cân tôm
  const handleShrimpFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => setShrimpImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Xử lý nạp file cho cân cá
  const handleFishFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => setFishImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Quét riêng Cân Tôm
  const handleScanShrimpOnly = async () => {
    if (!shrimpImage) return;
    setIsAnalyzingShrimp(true);
    setErrorMessage(null);
    try {
      const res = await analyzeWeighingImage(shrimpImage, premixCatalog, customApiKey, 'shrimp');
      setShrimpParsedCount(res.records?.length || 0);
      onUpdateFromDualScales(res.records, undefined, res.shiftInfoDetected);
      setSuccessMessage(`Đã bóc tách thành công ${res.records.length} nguyên liệu từ Cân Cám Tôm!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi phân tích Cân Cám Tôm.');
    } finally {
      setIsAnalyzingShrimp(false);
    }
  };

  // Quét riêng Cân Cá
  const handleScanFishOnly = async () => {
    if (!fishImage) return;
    setIsAnalyzingFish(true);
    setErrorMessage(null);
    try {
      const res = await analyzeWeighingImage(fishImage, premixCatalog, customApiKey, 'fish');
      setFishParsedCount(res.records?.length || 0);
      onUpdateFromDualScales(undefined, res.records, res.shiftInfoDetected);
      setSuccessMessage(`Đã bóc tách thành công ${res.records.length} nguyên liệu từ Cân Cám Cá!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi phân tích Cân Cám Cá.');
    } finally {
      setIsAnalyzingFish(false);
    }
  };

  // Quét CẢ 2 CÂN cùng lúc và tự động gộp (ví dụ 5 + 2 = 7)
  const handleScanBoth = async () => {
    if (!shrimpImage && !fishImage) {
      setErrorMessage('Vui lòng chụp hoặc tải ảnh của ít nhất 1 tháp cân (Cân Tôm hoặc Cân Cá).');
      return;
    }

    setIsAnalyzingBoth(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let parsedShrimp: any[] | undefined = undefined;
      let parsedFish: any[] | undefined = undefined;
      let shiftInfo: any = undefined;

      const promises = [];

      if (shrimpImage) {
        promises.push(
          analyzeWeighingImage(shrimpImage, premixCatalog, customApiKey, 'shrimp').then((res) => {
            parsedShrimp = res.records;
            if (res.shiftInfoDetected) shiftInfo = res.shiftInfoDetected;
            setShrimpParsedCount(res.records?.length || 0);
          })
        );
      }

      if (fishImage) {
        promises.push(
          analyzeWeighingImage(fishImage, premixCatalog, customApiKey, 'fish').then((res) => {
            parsedFish = res.records;
            if (res.shiftInfoDetected && !shiftInfo) shiftInfo = res.shiftInfoDetected;
            setFishParsedCount(res.records?.length || 0);
          })
        );
      }

      await Promise.all(promises);

      onUpdateFromDualScales(parsedShrimp, parsedFish, shiftInfo);

      const totalItems = (parsedShrimp ? (parsedShrimp as any[]).length : 0) + (parsedFish ? (parsedFish as any[]).length : 0);
      setSuccessMessage(
        `Quét hoàn tất! Đã tự động ghép nối ${totalItems} số liệu giữa 2 Tháp Cân (Tôm + Cá) vào bảng báo cáo!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi phân tích số liệu cân.');
    } finally {
      setIsAnalyzingBoth(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Chụp & Quét Ảnh 2 Tháp Cân: Cân Cám Tôm & Cân Cám Cá
          </h2>
        </div>
      </div>

      {/* Grid 2 Vị Trí Up Ảnh: Cân Tôm & Cân Cá */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* VỊ TRÍ 1: CÂN THÁP CÁM TÔM */}
        <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-blue-900 flex items-center gap-2">
                🦐 VỊ TRÍ 1: CÂN THÁP CÁM TÔM
              </span>
              {shrimpImage && (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đã có ảnh
                </span>
              )}
            </div>

            {!shrimpImage ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleShrimpFile(file);
                }}
                onClick={() => shrimpFileRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/70 rounded-xl p-6 text-center transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center"
              >
                <Upload className="w-8 h-8 text-blue-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Chụp hoặc tải ảnh màn hình Cân Tôm</p>
                <p className="text-[11px] text-slate-400 mt-1">Kéo thả hoặc nhấp để chọn</p>

                <input
                  ref={shrimpFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleShrimpFile(e.target.files[0])}
                />
                <input
                  ref={shrimpCamRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleShrimpFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[160px] max-h-[220px] flex items-center justify-center border border-slate-700">
                <img
                  src={shrimpImage}
                  alt="Cân Tôm"
                  className="max-h-[210px] w-auto object-contain"
                />
                <button
                  onClick={() => setShrimpImage(null)}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-rose-600 text-white text-[10px] px-2 py-1 rounded transition-colors"
                >
                  Đổi ảnh
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => shrimpCamRef.current?.click()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                Camera Cân Tôm
              </button>
              <button
                type="button"
                onClick={() => shrimpFileRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                Chọn File
              </button>
            </div>

            {shrimpImage && (
              <button
                type="button"
                disabled={isAnalyzingShrimp}
                onClick={handleScanShrimpOnly}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition-colors"
              >
                {isAnalyzingShrimp ? 'Đang quét...' : 'Quét Cân Tôm'}
              </button>
            )}
          </div>
        </div>

        {/* VỊ TRÍ 2: CÂN THÁP CÁM CÁ */}
        <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-emerald-900 flex items-center gap-2">
                🐟 VỊ TRÍ 2: CÂN THÁP CÁM CÁ
              </span>
              {fishImage && (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> Đã có ảnh
                </span>
              )}
            </div>

            {!fishImage ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFishFile(file);
                }}
                onClick={() => fishFileRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/70 rounded-xl p-6 text-center transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center"
              >
                <Upload className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Chụp hoặc tải ảnh màn hình Cân Cá</p>
                <p className="text-[11px] text-slate-400 mt-1">Kéo thả hoặc nhấp để chọn</p>

                <input
                  ref={fishFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFishFile(e.target.files[0])}
                />
                <input
                  ref={fishCamRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFishFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[160px] max-h-[220px] flex items-center justify-center border border-slate-700">
                <img
                  src={fishImage}
                  alt="Cân Cá"
                  className="max-h-[210px] w-auto object-contain"
                />
                <button
                  onClick={() => setFishImage(null)}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-rose-600 text-white text-[10px] px-2 py-1 rounded transition-colors"
                >
                  Đổi ảnh
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fishCamRef.current?.click()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                Camera Cân Cá
              </button>
              <button
                type="button"
                onClick={() => fishFileRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                Chọn File
              </button>
            </div>

            {fishImage && (
              <button
                type="button"
                disabled={isAnalyzingFish}
                onClick={handleScanFishOnly}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition-colors"
              >
                {isAnalyzingFish ? 'Đang quét...' : 'Quét Cân Cá'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Big Action Button: QUÉT CẢ 2 CÂN VÀ GỘP SỐ LIỆU */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            Hệ thống sẽ bóc tách cả 2 cân và tự động điền biểu thức: <code>KL = Tôm + Cá</code> (Ví dụ: <code>18 + 24</code> hoặc <code>5 + 2</code>)
          </span>
        </div>

        <button
          type="button"
          disabled={isAnalyzingBoth || (!shrimpImage && !fishImage)}
          onClick={handleScanBoth}
          className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
            isAnalyzingBoth || (!shrimpImage && !fishImage)
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 shadow-indigo-500/25 active:scale-95'
          }`}
        >
          {isAnalyzingBoth ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>AI Đang Phân Tích & Ghép Nối 2 Tháp Cân...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>QUÉT CẢ 2 CÂN VÀ GỘP SỐ LIỆU VÀO BÁO CÁO</span>
            </>
          )}
        </button>
      </div>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs sm:text-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs sm:text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
          </div>
          {errorMessage.includes('API Key') && (
            <button
              onClick={onOpenSettings}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg shrink-0"
            >
              Cài đặt API Key
            </button>
          )}
        </div>
      )}
    </div>
  );
};
