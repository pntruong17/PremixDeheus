'use client';

import React, { useState } from 'react';
import { HandoverReport } from '../types';
import { exportHandoverReportToExcel } from '../lib/excelExport';
import { FileSpreadsheet, Printer, Save, Check, ShieldCheck, Scale, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface SummaryReportProps {
  report: HandoverReport;
  onSaveToHistory: (report: HandoverReport) => void;
}

export const SummaryReport: React.FC<SummaryReportProps> = ({
  report,
  onSaveToHistory,
}) => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleExportExcel = () => {
    exportHandoverReportToExcel(report);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    onSaveToHistory(report);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const activeRows = report.rows.filter(r => r.actualTotal > 0 || r.theoryTotal > 0 || r.receivedQty > 0 || r.openingStock > 0);

  return (
    <div className="space-y-6">
      {/* Action Toolbar Card (No-Print) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Mẫu Biểu Bàn Giao De Heus • Section {report.shiftInfo.sectionCode}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
              Báo Cáo Ca: {report.shiftInfo.date} • Ca {report.shiftInfo.shiftNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Khung giờ: <strong className="text-slate-700">{report.shiftInfo.timeRange}</strong> | Nhân viên cân: <strong className="text-slate-700">{report.shiftInfo.operatorName}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Nút Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất File Excel Chuẩn De Heus (.xlsx)
            </button>

            {/* Nút In Phiếu A4 */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm bg-slate-800 hover:bg-slate-900 text-white active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              In Phiếu Báo Cáo A4 / PDF
            </button>

            {/* Nút Lưu Lịch Sử */}
            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                savedSuccess
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Đã Lưu Vào Lịch Sử
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-blue-600" />
                  Lưu Ca Này
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <span className="text-xs text-slate-500 font-medium block">Sử Dụng Thực Tế (Cân)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                {report.totalActualUsedKg.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">Tổng đã cân trong ca</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <span className="text-xs text-slate-500 font-medium block">Sử Dụng Lý Thuyết</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                {report.totalTheoryUsedKg.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">Theo công thức sản xuất</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <span className="text-xs text-slate-500 font-medium block">Tổng Tồn Cuối Ca</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {report.totalClosingStockKg.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">Bàn giao cho ca kế tiếp</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
            <span className="text-xs text-slate-500 font-medium block">Tổng Chênh Lệch (Sai số)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl sm:text-2xl font-black font-mono ${
                Math.abs(report.totalDiffKg) < 0.1 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {report.totalDiffKg > 0 ? `+${report.totalDiffKg.toFixed(2)}` : report.totalDiffKg.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-500">kg</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">Thực tế - Lý thuyết</span>
          </div>
        </div>
      </div>

      {/* Official De Heus Printable Form Layout */}
      <div className="bg-white rounded-xl shadow-md border border-slate-300 p-6 sm:p-8 print-container">
        {/* De Heus Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="grid grid-cols-3 items-start">
            {/* Left: De Heus Logo / Title */}
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                  de heus
                </span>
              </div>
            </div>

            {/* Center: Title */}
            <div className="text-center">
              <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                Bàn giao premix - phụ gia
              </h1>
            </div>

            {/* Right: Section Metadata */}
            <div className="text-right text-[11px] text-slate-700 font-mono space-y-0.5">
              <p>Section : <strong>{report.shiftInfo.sectionCode || '03F26'}</strong></p>
              <p>Revision : <strong>{report.shiftInfo.revision || '01'}</strong></p>
              <p>Date : <strong>{report.shiftInfo.formDate || '23/12/2025'}</strong></p>
              <p className="font-bold text-emerald-700">GMP - Q</p>
            </div>
          </div>

          {/* Subheader: Ngày, Giờ, Ca sx, NV cân */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 text-xs text-slate-800">
            <div>
              Ngày: <strong className="font-mono text-sm underline decoration-slate-400">{report.shiftInfo.date}</strong>
            </div>
            <div className="text-center font-mono">
              <strong className="bg-slate-100 px-2 py-0.5 rounded">{report.shiftInfo.timeRange}</strong>
            </div>
            <div className="text-center">
              Ca sx: <strong className="font-mono text-sm">{report.shiftInfo.shiftNumber}</strong>
            </div>
            <div className="text-right">
              Nhân viên cân: <strong className="text-sm underline decoration-slate-400">{report.shiftInfo.operatorName}</strong>
            </div>
          </div>
        </div>

        {/* Main De Heus Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-900 border-collapse">
            <thead className="bg-slate-100 text-slate-900 font-bold">
              <tr className="border-b border-slate-900 text-center">
                <th className="py-2.5 px-2 border-r border-slate-400 w-20">Code</th>
                <th className="py-2.5 px-3 border-r border-slate-400 min-w-[180px] text-left">Tên nguyên liệu</th>
                <th className="py-2.5 px-2 border-r border-slate-400 w-20">Tồn đầu<br /><span className="font-normal text-[10px]">KG</span></th>
                <th className="py-2.5 px-2 border-r border-slate-400 w-20">SL nhận<br /><span className="font-normal text-[10px]">(KG)</span></th>
                <th className="py-2.5 px-2 border-r border-slate-400 min-w-[130px]">
                  Số lượng<br />Sử dụng (KG)<br /><span className="text-blue-700">LÝ THUYẾT</span>
                </th>
                <th className="py-2.5 px-2 border-r border-slate-400 min-w-[160px]">
                  Số lượng<br />Sử dụng (KG)<br /><span className="text-amber-700">THỰC TẾ</span>
                </th>
                <th className="py-2.5 px-2 border-r border-slate-400 w-20">Tồn cuối<br /><span className="font-normal text-[10px]">KG</span></th>
                <th className="py-2.5 px-3 min-w-[180px] text-left">Số lô</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {report.rows.map((row) => {
                return (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2 border-r border-slate-300 font-mono text-center font-bold text-slate-800">
                      {row.code}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-900">
                      {row.name}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-300 font-mono text-right">
                      {row.openingStock || '0'}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-300 font-mono text-right text-blue-700 font-semibold">
                      {row.receivedQty > 0 ? row.receivedQty : ''}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-300 font-mono text-center">
                      {row.theoryExpression || (row.theoryTotal > 0 ? row.theoryTotal : '')}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-300 font-mono text-center font-bold text-slate-900 bg-amber-50/20">
                      {row.actualExpression || (row.actualTotal > 0 ? row.actualTotal : '')}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-300 font-mono text-right font-bold text-emerald-800 bg-emerald-50/30">
                      {row.closingStock.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-slate-700">
                      {row.lotNumber || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
              <tr className="border-t border-slate-900">
                <td colSpan={2} className="py-2.5 px-3 border-r border-slate-400 text-center uppercase">
                  TỔNG CỘNG (KG)
                </td>
                <td className="py-2.5 px-2 border-r border-slate-400 font-mono text-right">
                  {report.totalOpeningStockKg.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-400 font-mono text-right text-blue-700">
                  {report.totalReceivedKg.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-400 font-mono text-center">
                  {report.totalTheoryUsedKg.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-400 font-mono text-center text-amber-800 font-black">
                  {report.totalActualUsedKg.toFixed(2)}
                </td>
                <td className="py-2.5 px-2 border-r border-slate-400 font-mono text-right text-emerald-800 font-black">
                  {report.totalClosingStockKg.toFixed(2)}
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                  Chênh lệch: {report.totalDiffKg > 0 ? `+${report.totalDiffKg.toFixed(2)}` : report.totalDiffKg.toFixed(2)} kg
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Chữ ký xác nhận De Heus */}
        <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-800">
          <div>
            <p className="font-bold">Nhân viên cân</p>
            <p className="text-[10px] text-slate-400 italic mb-14">(Ký và ghi rõ họ tên)</p>
            <p className="font-bold text-slate-900">{report.shiftInfo.operatorName}</p>
          </div>
          <div>
            <p className="font-bold">Tổ trưởng sản xuất</p>
            <p className="text-[10px] text-slate-400 italic mb-14">(Ký xác nhận bàn giao)</p>
            <p className="font-semibold text-slate-500">...................................</p>
          </div>
          <div>
            <p className="font-bold">Giám sát phân xưởng</p>
            <p className="text-[10px] text-slate-400 italic mb-14">(Ký duyệt kiểm soát)</p>
            <p className="font-semibold text-slate-500">...................................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
