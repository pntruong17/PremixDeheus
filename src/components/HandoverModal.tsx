'use client';

import React, { useState } from 'react';
import { HandoverReport, PremixHandoverRow, ShiftInfo } from '../types';
import { CheckCircle2, ArrowRight, Save, Clock, User, Calendar, ShieldCheck, X, FileSpreadsheet, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { exportHandoverReportToExcel } from '../lib/excelExport';
import { syncReportToGoogleSheet } from '../lib/googleSheet';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentReport: HandoverReport;
  onConfirmHandover: (nextShiftInfo: ShiftInfo, nextRows: PremixHandoverRow[]) => void;
  onSaveHistoryOnly: (report: HandoverReport) => void;
  nextShiftData: {
    nextShiftInfo: ShiftInfo;
    nextRows: PremixHandoverRow[];
  };
  googleSheetUrl?: string;
  operatorsList?: string[];
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  currentReport,
  onConfirmHandover,
  onSaveHistoryOnly,
  nextShiftData,
  googleSheetUrl,
  operatorsList = [],
}) => {
  const [nextOperator, setNextOperator] = useState('');
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleHandoverNext = async () => {
    setIsSyncingSheet(true);
    setSyncStatusMsg('Đang lưu và đồng bộ lên Google Sheet...');

    // 1. Tự động đồng bộ Google Sheet nếu đã cấu hình
    if (googleSheetUrl) {
      try {
        const syncRes = await syncReportToGoogleSheet(currentReport, googleSheetUrl);
        if (syncRes.success) {
          setSyncStatusMsg('✓ Đã đồng bộ thành công lên Google Sheet!');
        } else {
          console.warn('Google Sheet Sync warning:', syncRes.message);
        }
      } catch (e) {
        console.error('Sheet sync error:', e);
      }
    }

    const customizedNextShift: ShiftInfo = {
      ...nextShiftData.nextShiftInfo,
      operatorName: nextOperator.trim() || 'Người nhận ca',
    };

    setTimeout(() => {
      setIsSyncingSheet(false);
      onConfirmHandover(customizedNextShift, nextShiftData.nextRows);
      onClose();
    }, 800);
  };

  const handleSaveOnly = async () => {
    setIsSyncingSheet(true);
    if (googleSheetUrl) {
      await syncReportToGoogleSheet(currentReport, googleSheetUrl);
    }
    onSaveHistoryOnly(currentReport);
    setSyncStatusMsg('✓ Đã lưu báo cáo thành công!');
    setTimeout(() => {
      setIsSyncingSheet(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg sm:max-w-xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3.5 sm:p-4 md:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">Nộp Báo Cáo & Bàn Giao Ca Sản Xuất</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
                Tự động đồng bộ Google Sheet & chuyển Tồn cuối $\rightarrow$ Tồn đầu ca mới
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 sm:space-y-4 overscroll-contain">
          {/* Card Ca Hiện Tại */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                1. Báo cáo ca đang nộp
              </span>
              <span className="text-[11px] sm:text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Ca {currentReport.shiftInfo.shiftNumber} ({currentReport.shiftInfo.timeRange})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] sm:text-[11px]">Ngày:</span>
                <strong className="text-slate-800 font-mono">{currentReport.shiftInfo.date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] sm:text-[11px]">Người cân:</span>
                <strong className="text-slate-800 truncate block">{currentReport.shiftInfo.operatorName || '—'}</strong>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] sm:text-[11px]">Thực tế cân:</span>
                <strong className="text-amber-600 font-mono font-black">{currentReport.totalActualUsedKg.toFixed(2)} kg</strong>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium text-[11px] sm:text-xs">Tổng tồn cuối bàn giao:</span>
              <span className="text-emerald-700 font-mono font-black text-xs sm:text-sm">
                {currentReport.totalClosingStockKg.toFixed(2)} kg
              </span>
            </div>
          </div>

          {/* Mũi tên chuyển giao */}
          <div className="flex items-center justify-center">
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Chuyển 100% Tồn Cuối $\rightarrow$ Tồn Đầu Ca Mới</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>
          </div>

          {/* Card Ca Tiếp Theo */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                2. Thiết lập cho ca tiếp theo
              </span>
              <span className="text-[11px] sm:text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded">
                Ca {nextShiftData.nextShiftInfo.shiftNumber} ({nextShiftData.nextShiftInfo.timeRange})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
              <div>
                <span className="text-slate-500 block text-[10px] sm:text-[11px] mb-0.5">Ngày ca mới:</span>
                <div className="bg-white border border-emerald-300/80 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-800 text-xs">
                  {nextShiftData.nextShiftInfo.date}
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block text-[10px] sm:text-[11px] mb-0.5">
                  Nhân viên nhận ca tiếp theo:
                </label>
                {operatorsList.length > 0 ? (
                  <select
                    value={nextOperator}
                    onChange={(e) => setNextOperator(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Chọn nhân viên nhận ca --</option>
                    {operatorsList.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Tên nhân viên nhận ca..."
                    value={nextOperator}
                    onChange={(e) => setNextOperator(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Google Sheet Sync Indicator */}
          {googleSheetUrl ? (
            <div className="p-2.5 bg-emerald-100/70 border border-emerald-200 rounded-lg text-emerald-950 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] leading-tight">
                <strong>Đã liên kết Google Sheet:</strong> Báo cáo sẽ tự động lưu và đồng bộ lên Google Drive.
              </span>
            </div>
          ) : (
            <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Chưa liên kết Google Sheet (Dữ liệu vẫn được lưu an toàn trong máy).</span>
            </div>
          )}

          {syncStatusMsg && (
            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-2">
              {isSyncingSheet && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{syncStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => exportHandoverReportToExcel(currentReport)}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel Ca Này</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncingSheet}
              onClick={handleSaveOnly}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              Chỉ Lưu Lịch Sử
            </button>

            <button
              type="button"
              disabled={isSyncingSheet}
              onClick={handleHandoverNext}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
            >
              {isSyncingSheet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Đồng Bộ...</span>
                </>
              ) : (
                <>
                  <span>Nộp & Bàn Giao Ca {nextShiftData.nextShiftInfo.shiftNumber}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
