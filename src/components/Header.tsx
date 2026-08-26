'use client';

import React, { useRef } from 'react';
import { ShiftInfo, AppSettings } from '../types';
import { Scale, Calendar, Clock, User, Cpu, Settings as SettingsIcon, Layers, FileSpreadsheet, ShieldCheck, CheckSquare, ArrowRight, Lock, Unlock, ShieldAlert } from 'lucide-react';

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
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLockAdmin: () => void;
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
  isAdmin,
  onOpenAdminLogin,
  onLockAdmin,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Helper chuyển đổi qua lại giữa DD/MM/YYYY và YYYY-MM-DD (cho input type="date")
  const formatDateToIso = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return '';
  };

  const formatIsoToDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };
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

            {/* Quyền Quản Trị (Admin): Nút Cài Đặt & Nút Khóa / Mở Khóa */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg border border-blue-500/50 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                  title="Cài đặt hệ thống & Cấu hình (Quản trị viên)"
                >
                  <SettingsIcon className="w-4 h-4 text-blue-300 animate-spin-slow" />
                  <span className="hidden sm:inline">Cài đặt</span>
                </button>

                <button
                  type="button"
                  onClick={onLockAdmin}
                  className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-rose-900/40 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 transition-all flex items-center gap-1 text-xs"
                  title="Đang ở chế độ Quản trị viên (Bấm để Khóa lại cho nhân viên dùng)"
                >
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-emerald-300">Admin</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all flex items-center gap-1"
                title="Đăng nhập Quản trị viên"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Shift Selector Toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Ngày - Bấm vào hiện lịch */}
            <div
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-md border border-slate-700 hover:border-blue-500/50 transition-colors cursor-pointer"
              title="Nhấp để mở lịch chọn ngày"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 text-[11px]">Ngày:</span>
              <input
                ref={dateInputRef}
                type="date"
                value={formatDateToIso(shiftInfo.date)}
                onChange={(e) => {
                  if (e.target.value) {
                    onShiftInfoChange({
                      ...shiftInfo,
                      date: formatIsoToDisplay(e.target.value),
                    });
                  }
                }}
                className="bg-transparent text-white focus:outline-none font-mono font-bold text-xs cursor-pointer [color-scheme:dark]"
              />
            </div>

            {/* Ca sx (đã kèm sẵn khung giờ) */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-md border border-slate-700">
              <span className="text-slate-400 text-[11px]">Ca sx:</span>
              <select
                value={shiftInfo.shiftNumber}
                onChange={(e) => {
                  const num = e.target.value;
                  let tr = '06h00 -> 14h00';
                  if (num === '2') tr = '14h00 -> 22h00';
                  else if (num === '3') tr = '22h00 -> 06h00';
                  onShiftInfoChange({
                    ...shiftInfo,
                    shiftNumber: num,
                    timeRange: tr,
                  });
                }}
                className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer"
              >
                <option value="1" className="bg-slate-900 text-white">Ca 1 (06h - 14h)</option>
                <option value="2" className="bg-slate-900 text-white">Ca 2 (14h - 22h)</option>
                <option value="3" className="bg-slate-900 text-white">Ca 3 (22h - 06h)</option>
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

        {/* Navigation Tabs - Ẩn tab Danh Mục nếu không phải Admin */}
        <nav className="flex space-x-1 sm:space-x-2 mt-3 overflow-x-auto pb-1">
          {[
            { id: 'scanner', label: '1. Quét Ảnh & Nhập Phiếu', icon: Cpu, adminOnly: false },
            { id: 'report', label: '2. Mẫu Báo Cáo De Heus & Xuất Excel', icon: FileSpreadsheet, adminOnly: false },
            { id: 'catalog', label: '3. Danh Mục 43 Loại & Quy Cách Bao', icon: Layers, adminOnly: true },
            { id: 'history', label: '4. Lịch Sử Báo Cáo Ca', icon: Clock, adminOnly: false },
          ]
            .filter((tab) => !tab.adminOnly || isAdmin)
            .map((tab) => {
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
