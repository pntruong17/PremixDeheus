'use client';

import React, { useState } from 'react';
import { User, UserPlus, Trash2, X, RotateCcw, Check, Users } from 'lucide-react';
import { DEFAULT_OPERATORS_LIST } from '../lib/storage';

interface OperatorManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  operatorsList: string[];
  currentOperator: string;
  onUpdateOperatorsList: (newList: string[]) => void;
  onSelectOperator: (name: string) => void;
}

export const OperatorManageModal: React.FC<OperatorManageModalProps> = ({
  isOpen,
  onClose,
  operatorsList,
  currentOperator,
  onUpdateOperatorsList,
  onSelectOperator,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newMemberName.trim();
    if (!clean) {
      setErrorMsg('Vui lòng nhập tên thành viên');
      return;
    }
    if (operatorsList.some((op) => op.toLowerCase() === clean.toLowerCase())) {
      setErrorMsg('Tên thành viên này đã có trong danh sách');
      return;
    }

    const updated = [...operatorsList, clean];
    onUpdateOperatorsList(updated);
    setNewMemberName('');
    setErrorMsg('');
  };

  const handleDelete = (nameToDelete: string) => {
    if (operatorsList.length <= 1) {
      setErrorMsg('Danh sách phải có ít nhất 1 thành viên');
      return;
    }
    const updated = operatorsList.filter((op) => op !== nameToDelete);
    onUpdateOperatorsList(updated);
    if (currentOperator === nameToDelete && updated.length > 0) {
      onSelectOperator(updated[0]);
    }
    setErrorMsg('');
  };

  const handleResetDefault = () => {
    if (confirm('Khôi phục lại danh sách 7 thành viên mặc định?')) {
      onUpdateOperatorsList(DEFAULT_OPERATORS_LIST);
      setErrorMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Danh Sách Người Làm Báo Cáo</h3>
              <p className="text-[10px] text-slate-400">Thêm, xóa và quản lý nhân viên cân ca</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          {/* Form thêm mới */}
          <form onSubmit={handleAdd} className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Thêm thành viên mới</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Nhập tên nhân viên (ví dụ: T.Trường)..."
                  value={newMemberName}
                  onChange={(e) => {
                    setNewMemberName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Thêm
              </button>
            </div>
            {errorMsg && <p className="text-[11px] text-rose-600 font-medium">{errorMsg}</p>}
          </form>

          {/* Danh sách thành viên hiện có */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Thành viên hiện có ({operatorsList.length} người)
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại 7 người gốc
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {operatorsList.map((op) => {
                const isSelected = currentOperator === op;
                return (
                  <div
                    key={op}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOperator(op);
                      }}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {op.charAt(0)}
                      </div>
                      <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}>
                        {op}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          Đang chọn
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(op)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={`Xóa ${op} khỏi danh sách`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
