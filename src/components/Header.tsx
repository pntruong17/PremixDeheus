'use client';

import React from 'react';
import { ShiftInfo, AppSettings } from '../types';
import { Scale, Calendar, Clock, User, Cpu, Settings as SettingsIcon, Layers, FileSpreadsheet, ShieldCheck, CheckSquare, ArrowRight } from 'lucide-react';

interface HeaderProps {
  shiftInfo: ShiftInfo;
  onShiftInfoChange: (newInfo: ShiftInfo) => void;
  onOpenSettings: () => void;
  onOpenHandover: () => void;
  settings: AppSettings;
  totalActualUsedKg: number;
  totalTheoryUsedKg: number;
  totalClosingStockKg: number;
  activeRowCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  shiftInfo,
  onShiftInfoChange,
  onOpenSettings,
  onOpenHandover,
  settings,
  totalActualUsedKg,
  totalTheoryUsedKg,
  totalClosingStockKg,
  activeRowCount,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 no-print">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 font-black text-white text-xs tracking-tighter">
              DH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  BÀN GIAO PREMIX - PHỤ GIA
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                  De Heus • {shiftInfo.sectionCode || '03F26'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tự động nối ca: Tồn cuối ca trước $\rightarrow$ Tồn đầu ca sau (3 ca/ngày)
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges, Handover Button & Settings */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Đang dùng:</span>
                <span className="font-bold text-blue-400 text-xs sm:text-sm">{activeRowCount} loại</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">Thực tế ca:</span>
                <span className="font-bold text-amber-400 text-xs sm:text-sm">{totalActualUsedKg.toFixed(2)} kg</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px]">Tổng tồn cuối:</span>
                <span className="font-bold text-emerald-400 text-xs sm:text-sm">{totalClosingStockKg.toFixed(2)} kg</span>
              </div>
            </div>

            {/* Nút Nộp Báo Cáo & Bàn Giao Ca */}
            <button
              type="button"
              onClick={onOpenHandover}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
              title="Nộp báo cáo và tự động chuyển tồn cuối thành tồn đầu ca tiếp theo"
            >
              <CheckSquare className="w-4 h-4 text-emerald-200" />
              <span>Nộp & Bàn Giao Ca</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Cài đặt hệ thống & Cấu hình"
            >
              <SettingsIcon className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Shift Selector Toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Ngày */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Ngày:</span>
              <input
                type="text"
                value={shiftInfo.date}
                onChange={(e) => onShiftInfoChange({ ...shiftInfo, date: e.target.value })}
                className="bg-transparent text-white focus:outline-none w-24 sm:w-28 font-mono font-bold"
                placeholder="DD/MM/YYYY"
              />
            </div>

            {/* Khung giờ */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Giờ:</span>
              <input
                type="text"
                value={shiftInfo.timeRange}
                onChange={(e) => onShiftInfoChange({ ...shiftInfo, timeRange: e.target.value })}
                className="bg-transparent text-white focus:outline-none w-32 font-mono"
                placeholder="07h30 -> 15h30"
              />
            </div>

            {/* Ca sx */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700">
              <span className="text-slate-400 text-[11px]">Ca sx:</span>
              <select
                value={shiftInfo.shiftNumber}
                onChange={(e) => onShiftInfoChange({ ...shiftInfo, shiftNumber: e.target.value })}
                className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer"
              >
                <option value="1" className="bg-slate-900 text-white">Ca 1 (06h - 14h)</option>
                <option value="2" className="bg-slate-900 text-white">Ca 2 (14h - 22h)</option>
                <option value="3" className="bg-slate-900 text-white">Ca 3 (22h - 06h / 07h30 - 15h30)</option>
              </select>
            </div>

            {/* Nhân viên cân */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">NV cân:</span>
              <input
                type="text"
                placeholder="Tên nhân viên..."
                value={shiftInfo.operatorName}
                onChange={(e) => onShiftInfoChange({ ...shiftInfo, operatorName: e.target.value })}
                className="bg-transparent text-white focus:outline-none w-24 sm:w-28 placeholder-slate-500 font-semibold"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 hidden lg:flex items-center gap-3">
            <span>Section: <strong className="text-slate-200">{shiftInfo.sectionCode}</strong></span>
            <span>Rev: <strong className="text-slate-200">{shiftInfo.revision}</strong></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> GMP - Q
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 mt-3 overflow-x-auto pb-1">
          {[
            { id: 'scanner', label: '1. Quét Ảnh & Nhập Phiếu', icon: Cpu },
            { id: 'report', label: '2. Mẫu Báo Cáo De Heus & Xuất Excel', icon: FileSpreadsheet },
            { id: 'catalog', label: '3. Danh Mục 43 Loại & Quy Cách Bao', icon: Layers },
            { id: 'history', label: '4. Lịch Sử Báo Cáo Ca', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
