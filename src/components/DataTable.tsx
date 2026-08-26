'use client';

import React, { useState } from 'react';
import { PremixHandoverRow, PremixItem } from '../types';
import { Plus, Trash2, RotateCcw, CheckCircle2, AlertTriangle, Sparkles, FileEdit, PackagePlus, Sliders, Check, Zap, Info, FileText, Layers, CloudDownload, RefreshCw } from 'lucide-react';
import { recalculateRow, getPremixBagSize } from '../lib/storage';

interface DataTableProps {
  rows: PremixHandoverRow[];
  premixCatalog: PremixItem[];
  autoReceipt: boolean;
  onToggleAutoReceipt: (enabled: boolean) => void;
  onUpdateRow: (id: string, updatedRow: PremixHandoverRow) => void;
  onDeleteRow: (id: string) => void;
  onAddRow: () => void;
  onResetToDefaultList: () => void;
  onLoadExampleFromPhoto: () => void;
  onBulkUpdateOpeningStock: (stockMap: { [code: string]: number }) => void;
  onRecalculateAllReceipts: () => void;
  onFetchGoogleSheetStocks?: () => void;
  isFetchingSheet?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  premixCatalog,
  autoReceipt,
  onToggleAutoReceipt,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
  onResetToDefaultList,
  onLoadExampleFromPhoto,
  onBulkUpdateOpeningStock,
  onRecalculateAllReceipts,
  onFetchGoogleSheetStocks,
  isFetchingSheet = false,
}) => {
  const [isCalibratingStock, setIsCalibratingStock] = useState(false);
  const [calibrationMap, setCalibrationMap] = useState<{ [code: string]: number }>({});
  const [selectedPageFilter, setSelectedPageFilter] = useState<number | 'all'>('all');

  const handleOpenCalibration = () => {
    const currentMap: { [code: string]: number } = {};
    rows.forEach((r) => {
      currentMap[r.code] = r.openingStock || 0;
    });
    setCalibrationMap(currentMap);
    setIsCalibratingStock(true);
  };

  const handleSaveCalibration = () => {
    onBulkUpdateOpeningStock(calibrationMap);
    setIsCalibratingStock(false);
  };

  const handleChange = (id: string, field: keyof PremixHandoverRow, value: any) => {
    const target = rows.find((r) => r.id === id);
    if (!target) return;

    let updated = { ...target, [field]: value };

    if (field === 'name') {
      const matched = premixCatalog.find((p) => p.name === value);
      if (matched) {
        updated.code = matched.code;
        updated.pageNumber = matched.pageNumber;
        if (!updated.lotNumber && matched.defaultLotNumber) {
          updated.lotNumber = matched.defaultLotNumber;
        }
        if (updated.openingStock === 0 && matched.defaultOpeningStock) {
          updated.openingStock = matched.defaultOpeningStock;
        }
      }
    }

    const shouldAuto = field === 'receivedQty' ? false : autoReceipt;
    updated = recalculateRow(updated, 0.5, shouldAuto, premixCatalog);
    onUpdateRow(id, updated);
  };

  const handleStepBag = (id: string, step: number) => {
    const target = rows.find((r) => r.id === id);
    if (!target) return;

    const bagSize = getPremixBagSize(target.code, target.name, premixCatalog);
    const currentReceived = Number(target.receivedQty) || 0;
    const newReceived = Math.max(0, currentReceived + step * bagSize);

    const updated = recalculateRow(
      { ...target, receivedQty: newReceived },
      0.5,
      false,
      premixCatalog
    );
    onUpdateRow(id, updated);
  };

  const filteredRows = selectedPageFilter === 'all' 
    ? rows 
    : rows.filter((r) => r.pageNumber === selectedPageFilter);

  const getPageTitle = (page: number) => {
    switch (page) {
      case 1: return 'Trang 1: Spc X-Soy, Aqualyso, Mycelium, Muối, Choline, Betain (11 mục)';
      case 2: return 'Trang 2: Yuxiabao, Taurine, Lysine, Methionine, Threonine, Tryptophane, Arginine, Toxifix (14 mục)';
      case 3: return 'Trang 3: Calcium Propionate, Tributyrin, So-mate P, Kelenon II, Mg Oxide, Đá vôi (9 mục)';
      case 4: return 'Trang 4: Aqua Vitamin/Mineral/Shrimp Premix, Tinh bột biến tính, Protide, Bột cá (9 mục)';
      default: return `Trang ${page}`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-blue-600" />
              Bảng Bàn Giao Theo Thứ Tự 4 Trang Giấy Báo Cáo
            </h3>
            <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
              Đúng thứ tự 43 nguyên liệu từ trên xuống dưới
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Được sắp xếp chuẩn theo 4 trang biểu mẫu giấy để người làm báo cáo dễ dàng chép lại trực tiếp!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Nút Đồng bộ Tồn đầu từ Google Sheet */}
          {onFetchGoogleSheetStocks && (
            <button
              type="button"
              disabled={isFetchingSheet}
              onClick={onFetchGoogleSheetStocks}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Lấy số liệu Tồn đầu mới nhất do ca trước vừa nộp lên Google Sheet"
            >
              {isFetchingSheet ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <CloudDownload className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {isFetchingSheet ? 'Đang tải...' : 'Lấy Tồn Đầu từ Google Sheet'}
            </button>
          )}

          {/* Nút Bật/Tắt Tự động tính SL Nhận */}
          <button
            type="button"
            onClick={() => onToggleAutoReceipt(!autoReceipt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              autoReceipt
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
            title="Bật/Tắt chế độ tự động quyết định SL Nhận kho"
          >
            <Zap className={`w-3.5 h-3.5 ${autoReceipt ? 'text-amber-300' : 'text-slate-400'}`} />
            {autoReceipt ? '⚡ Tự Động Nhận Kho: BẬT' : 'Tự Động Nhận Kho: TẮT'}
          </button>

          {/* Nút Hiệu chỉnh Tồn đầu */}
          <button
            type="button"
            onClick={handleOpenCalibration}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-4 h-4" />
            Hiệu chỉnh Tồn Đầu
          </button>

          {/* Nút Mẫu Phiếu Thực Tế */}
          <button
            type="button"
            onClick={onLoadExampleFromPhoto}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Nạp số liệu mẫu thực tế 100% khớp phiếu chụp 4 trang"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Nạp mẫu 4 trang
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Khôi phục danh sách đầy đủ 43 nguyên liệu theo thứ tự 4 trang giấy?')) {
                onResetToDefaultList();
              }
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục 43 mục
          </button>
        </div>
      </div>

      {/* Bộ Lọc Theo Từng Trang Giấy (Trang 1, 2, 3, 4) */}
      <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Xem theo trang:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedPageFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              selectedPageFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Toàn bộ 4 trang ({rows.length} mục)
          </button>
          {[1, 2, 3, 4].map((p) => {
            const count = rows.filter((r) => r.pageNumber === p).length;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPageFilter(p)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedPageFilter === p
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Trang {p} ({count} mục)
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal / Khung Hiệu chỉnh Tồn Đầu */}
      {isCalibratingStock && (
        <div className="p-4 sm:p-5 bg-purple-50/70 border-b-2 border-purple-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                Hiệu Chỉnh Khối Lượng Tồn Đầu (KG) Cho Từng Nguyên Liệu
              </h4>
              <p className="text-xs text-purple-700">
                Nhập số kg tồn đầu thực tế đo đếm được tại kho/xưởng trước khi bắt đầu ca
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCalibratingStock(false)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCalibration}
                className="px-4 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Áp Dụng Tồn Đầu
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1">
            {rows.map((r) => (
              <div key={r.id} className="bg-white p-2 rounded-lg border border-purple-200 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-800 block truncate" title={r.name}>
                  [Trang {r.pageNumber || 1}] {r.name}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    value={calibrationMap[r.code] !== undefined ? calibrationMap[r.code] : r.openingStock}
                    onChange={(e) =>
                      setCalibrationMap({
                        ...calibrationMap,
                        [r.code]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-right bg-purple-50/50 border border-purple-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-purple-900 focus:outline-none focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400">kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-300">
            <tr>
              <th className="py-3 px-2 w-14 text-center">Trang</th>
              <th className="py-3 px-2.5 w-20">Code</th>
              <th className="py-3 px-3 min-w-[180px]">Tên nguyên liệu</th>
              <th className="py-3 px-2.5 w-24 text-right">Tồn đầu<br /><span className="text-[10px] text-slate-500 font-normal">KG</span></th>
              <th className="py-3 px-3 min-w-[180px] text-right bg-blue-50/40">
                SL nhận kho (KG)<br />
                <span className="text-[10px] text-blue-700 font-semibold">Tự Quyết Định Theo Bao</span>
              </th>
              <th className="py-3 px-3 min-w-[140px]">Số lượng Sử dụng (KG)<br /><span className="text-[10px] text-blue-600 font-semibold">LÝ THUYẾT (Tôm+Cá)</span></th>
              <th className="py-3 px-3 min-w-[170px]">Số lượng Sử dụng (KG)<br /><span className="text-[10px] text-amber-600 font-semibold">THỰC TẾ (CÂN)</span></th>
              <th className="py-3 px-2.5 w-24 text-right bg-emerald-50/70 text-emerald-950">
                Tồn cuối<br />
                <span className="text-[10px] text-emerald-700 font-normal">KG (&lt; 1 bao)</span>
              </th>
              <th className="py-3 px-3 min-w-[180px]">Số lô</th>
              <th className="py-3 px-2 w-10 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRows.map((row, index) => {
              const hasActivity = row.actualTotal > 0 || row.theoryTotal > 0 || row.receivedQty > 0;
              const isError = !row.isWithinTolerance && row.theoryTotal > 0;
              const bagSize = getPremixBagSize(row.code, row.name, premixCatalog);
              const bagCount = row.receivedQty > 0 ? (row.receivedQty / bagSize) : 0;
              const isBagInteger = Number.isInteger(bagCount);

              const prevRow = filteredRows[index - 1];
              const isFirstOfPage = selectedPageFilter === 'all' && (!prevRow || prevRow.pageNumber !== row.pageNumber);

              return (
                <React.Fragment key={row.id}>
                  {isFirstOfPage && row.pageNumber && (
                    <tr className="bg-slate-800 text-white font-bold">
                      <td colSpan={10} className="py-2 px-4 text-xs tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          📄 <strong>{getPageTitle(row.pageNumber)}</strong>
                        </span>
                        <span className="text-[11px] font-normal text-slate-300">
                          (Dòng {index + 1} / {filteredRows.length})
                        </span>
                      </td>
                    </tr>
                  )}

                  <tr
                    className={`hover:bg-blue-50/30 transition-colors ${
                      hasActivity ? 'bg-white font-medium' : 'bg-slate-50/40 text-slate-500'
                    } ${isError ? 'bg-amber-50/50' : ''}`}
                  >
                    {/* Số trang */}
                    <td className="py-2 px-2 text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        T{row.pageNumber || 1}
                      </span>
                    </td>

                    {/* Code */}
                    <td className="py-2 px-2.5">
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => handleChange(row.id, 'code', e.target.value)}
                        placeholder="Code..."
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded text-xs font-mono font-bold text-slate-800 focus:outline-none"
                      />
                    </td>

                    {/* Tên nguyên liệu & Quy cách bao */}
                    <td className="py-2 px-3">
                      <div className="flex flex-col">
                        <select
                          value={row.name}
                          onChange={(e) => handleChange(row.id, 'name', e.target.value)}
                          className="w-full bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-1.5 py-1 text-xs font-bold text-slate-900 focus:outline-none truncate"
                        >
                          <option value={row.name}>{row.name}</option>
                          <optgroup label="--- Danh mục 43 nguyên liệu De Heus ---">
                            {premixCatalog.map((p) => (
                              <option key={p.id} value={p.name}>
                                [T{p.pageNumber || 1}] {p.name} ({p.code})
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Quy cách: <strong className="text-slate-600">{bagSize}kg/{bagSize >= 800 ? 'túi' : 'bao'}</strong>
                          </span>
                          {row.receivedQty > 0 && (
                            <span className="text-[10px] text-blue-700 bg-blue-100 font-bold px-1.5 py-0.2 rounded font-mono">
                              {isBagInteger ? `${bagCount} bao` : `${bagCount.toFixed(1)} bao`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tồn đầu KG */}
                    <td className="py-2 px-2.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={row.openingStock || ''}
                        onChange={(e) => handleChange(row.id, 'openingStock', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-20 text-right bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 px-1.5 py-0.5 rounded text-xs font-mono font-semibold focus:outline-none"
                      />
                    </td>

                    {/* SL nhận kho (KG) */}
                    <td className="py-2 px-3 text-right bg-blue-50/20">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleStepBag(row.id, -1)}
                          className="w-5 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-black flex items-center justify-center"
                          title={`Bớt 1 bao (${bagSize}kg)`}
                        >
                          -
                        </button>

                        <input
                          type="number"
                          step="0.01"
                          value={row.receivedQty > 0 ? row.receivedQty : ''}
                          onChange={(e) => handleChange(row.id, 'receivedQty', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-16 text-right bg-blue-50/70 hover:bg-white focus:bg-white border border-blue-300 focus:border-blue-500 px-1.5 py-0.5 rounded text-xs font-mono font-black text-blue-900 focus:outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleStepBag(row.id, 1)}
                          className="w-5 h-6 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-black flex items-center justify-center"
                          title={`Thêm 1 bao (${bagSize}kg)`}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Lý thuyết (KG) */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={row.theoryExpression}
                          onChange={(e) => handleChange(row.id, 'theoryExpression', e.target.value)}
                          placeholder="VD: 8 + 16"
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 px-2 py-0.5 rounded text-xs font-mono text-slate-800 focus:outline-none"
                        />
                        {row.theoryTotal > 0 && row.theoryExpression.includes('+') && (
                          <span className="text-[11px] font-bold font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                            = {row.theoryTotal}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thực tế (KG) */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={row.actualExpression}
                          onChange={(e) => handleChange(row.id, 'actualExpression', e.target.value)}
                          placeholder="VD: 8.01 + 15.99"
                          className={`w-full border focus:bg-white px-2 py-0.5 rounded text-xs font-mono font-bold focus:outline-none ${
                            isError
                              ? 'bg-rose-50 border-rose-300 text-rose-700 focus:border-rose-500'
                              : 'bg-amber-50/50 border-amber-200 text-amber-900 focus:border-blue-500'
                          }`}
                        />
                        {row.actualTotal > 0 && (
                          <span className="text-[11px] font-black font-mono text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded whitespace-nowrap">
                            = {row.actualTotal}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tồn cuối KG */}
                    <td className="py-2 px-2.5 text-right bg-emerald-50/50">
                      <span className="font-mono font-black text-xs text-emerald-800 block">
                        {row.closingStock.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-emerald-600 block">
                        &lt; {bagSize}kg
                      </span>
                    </td>

                    {/* Số lô */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.lotNumber || ''}
                        onChange={(e) => handleChange(row.id, 'lotNumber', e.target.value)}
                        placeholder="Số lô..."
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1.5 py-0.5 rounded text-xs font-mono text-slate-700 focus:outline-none"
                      />
                    </td>

                    {/* Nút xóa */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRow(row.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
