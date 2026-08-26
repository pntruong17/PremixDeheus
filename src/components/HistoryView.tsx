'use client';

import React, { useState } from 'react';
import { HandoverReport } from '../types';
import { exportHandoverReportToExcel } from '../lib/excelExport';
import { Calendar, Clock, FileSpreadsheet, Trash2, ArrowUpRight, Search, History } from 'lucide-react';

interface HistoryViewProps {
  history: HandoverReport[];
  onLoadReport: (report: HandoverReport) => void;
  onDeleteReport: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onLoadReport,
  onDeleteReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((report) => {
    const s = searchTerm.toLowerCase();
    return (
      (report.shiftInfo.date && report.shiftInfo.date.includes(s)) ||
      (report.shiftInfo.shiftNumber && report.shiftInfo.shiftNumber.toLowerCase().includes(s)) ||
      (report.shiftInfo.operatorName && report.shiftInfo.operatorName.toLowerCase().includes(s))
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Lịch Sử Báo Cáo Ca Đã Lưu ({history.length} ca)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu được lưu trữ tự động trên thiết bị. Bạn có thể mở lại để xem hoặc xuất lại file Excel bất cứ lúc nào.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo ngày, ca, người cân..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">Chưa có báo cáo ca nào được lưu</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Sau khi hoàn thành ca, hãy bấm "Lưu Ca Này" ở tab Báo Cáo.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredHistory.map((report) => (
            <div
              key={report.id}
              className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {report.shiftInfo.date}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                    Ca {report.shiftInfo.shiftNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    | Giờ: <strong className="text-slate-700">{report.shiftInfo.timeRange}</strong>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    | Người cân: <strong className="text-slate-700">{report.shiftInfo.operatorName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <span>
                    Tổng thực tế: <strong className="text-amber-700 font-mono">{report.totalActualUsedKg.toFixed(2)} kg</strong>
                  </span>
                  <span>
                    Tổng tồn cuối: <strong className="text-emerald-700 font-mono">{report.totalClosingStockKg.toFixed(2)} kg</strong>
                  </span>
                  <span>
                    Số nguyên liệu: <strong className="text-slate-800 font-mono">{report.rows.length} loại</strong>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Lưu lúc: {new Date(report.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => onLoadReport(report)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-emerald-200 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Mở Lại Ca
                </button>

                <button
                  type="button"
                  onClick={() => exportHandoverReportToExcel(report)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Xuất file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa báo cáo ca ${report.shiftInfo.date} - Ca ${report.shiftInfo.shiftNumber}?`)) {
                      onDeleteReport(report.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                  title="Xóa báo cáo này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
