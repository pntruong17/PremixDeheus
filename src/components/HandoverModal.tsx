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
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  isOpen,
  onClose,
  currentReport,
  onConfirmHandover,
  onSaveHistoryOnly,
  nextShiftData,
  googleSheetUrl,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nộp Báo Cáo & Bàn Giao Ca Sản Xuất</h3>
              <p className="text-xs text-slate-400">
                Tự động đồng bộ Google Sheet & chuyển Tồn cuối $\rightarrow$ Tồn đầu ca tiếp theo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Card Ca Hiện Tại */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Báo cáo ca đang nộp
              </span>
              <span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Ca {currentReport.shiftInfo.shiftNumber} ({currentReport.shiftInfo.timeRange})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày:</span>
                <strong className="text-slate-800">{currentReport.shiftInfo.date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Người cân:</span>
                <strong className="text-slate-800">{currentReport.shiftInfo.operatorName || '—'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thực tế cân:</span>
                <strong className="text-amber-600 font-mono font-black">{currentReport.totalActualUsedKg.toFixed(2)} kg</strong>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Tổng tồn cuối bàn giao:</span>
              <span className="text-emerald-700 font-mono font-black text-sm">
                {currentReport.totalClosingStockKg.toFixed(2)} kg
              </span>
            </div>
          </div>

          {/* Mũi tên chuyển giao */}
          <div className="flex items-center justify-center -my-2">
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chuyển 100% Tồn Cuối làm Tồn Đầu Cho Ca Mới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card Ca Tiếp Theo */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                2. Thiết lập cho ca tiếp theo
              </span>
              <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded">
                Ca {nextShiftData.nextShiftInfo.shiftNumber} ({nextShiftData.nextShiftInfo.timeRange})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Ngày ca mới:</span>
                <strong className="text-slate-800">{nextShiftData.nextShiftInfo.date}</strong>
              </div>
              <div>
                <label className="text-slate-700 font-bold block text-[11px] mb-1">
                  Nhân viên nhận ca tiếp theo:
                </label>
                <input
                  type="text"
                  placeholder="Tên nhân viên nhận ca..."
                  value={nextOperator}
                  onChange={(e) => setNextOperator(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Google Sheet Sync Indicator */}
          {googleSheetUrl ? (
            <div className="p-2.5 bg-emerald-100/60 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã kết nối Google Sheet: Báo cáo sẽ tự động lưu và đồng bộ đa thiết bị!</span>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Chưa liên kết Google Sheet (Dữ liệu vẫn được lưu an toàn 100% trong bộ nhớ máy).</span>
            </div>
          )}

          {syncStatusMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold text-center animate-fadeIn flex items-center justify-center gap-2">
              {isSyncingSheet && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{syncStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => exportHandoverReportToExcel(currentReport)}
            className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Excel Ca Này
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSyncingSheet}
              onClick={handleSaveOnly}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
            >
              Chỉ Lưu Lịch Sử
            </button>

            <button
              type="button"
              disabled={isSyncingSheet}
              onClick={handleHandoverNext}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95"
            >
              {isSyncingSheet ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Đồng Bộ...</span>
                </>
              ) : (
                <>
                  <span>Nộp & Chuyển Sang Ca {nextShiftData.nextShiftInfo.shiftNumber}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
