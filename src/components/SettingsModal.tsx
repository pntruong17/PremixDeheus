'use client';

import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Key, Building2, User, Sliders, ExternalLink, Check, Sparkles, AlertCircle, FileSpreadsheet, Copy, CheckCircle2 } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../lib/googleSheet';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  
  const [copiedScript, setCopiedScript] = useState(false);
  const [testSheetStatus, setTestSheetStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testSheetMsg, setTestSheetMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleTestKey = async () => {
    if (!formData.geminiApiKey) {
      setTestStatus('error');
      setTestMessage('Vui lòng nhập API Key trước khi kiểm tra.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Đang kết nối Google Gemini API...');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${formData.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping test. Reply with OK.' }] }],
          }),
        }
      );

      if (response.ok) {
        setTestStatus('success');
        setTestMessage('Kết nối Gemini API thành công! Bạn có thể bắt đầu quét ảnh.');
      } else {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || `Lỗi HTTP ${response.status}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Kết nối thất bại: ${err.message}`);
    }
  };

  const handleTestGoogleSheet = async () => {
    if (!formData.googleSheetUrl) {
      setTestSheetStatus('error');
      setTestSheetMsg('Vui lòng dán URL Ứng Dụng Web Google Sheet vào ô trên.');
      return;
    }

    setTestSheetStatus('testing');
    setTestSheetMsg('Đang kiểm tra kết nối tới Google Sheet...');

    try {
      const res = await fetch(`/api/sheet?webAppUrl=${encodeURIComponent(formData.googleSheetUrl)}`);
      const data = await res.json();
      if (data.status === 'SUCCESS' || data.status === 'EMPTY') {
        setTestSheetStatus('success');
        setTestSheetMsg('Kết nối Google Sheet thành công! Báo cáo ca sẽ được tự động đồng bộ.');
      } else {
        throw new Error(data.message || 'Không nhận được phản hồi hợp lệ');
      }
    } catch (err: any) {
      setTestSheetStatus('error');
      setTestSheetMsg(`Kết nối thất bại: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Cài Đặt Hệ Thống & Đồng Bộ Đa Thiết Bị</h3>
              <p className="text-xs text-slate-400">Cấu hình API AI & Bảng tính Google Sheet miễn phí 100%</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Google Sheet Sync (NEW) */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Đồng Bộ Google Sheet (Xem & Sửa Trực Tiếp Trên Điện Thoại/Máy Tính)
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Miễn phí 100%
              </span>
            </div>

            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Mỗi khi nhân viên bấm <strong>"Nộp & Bàn Giao Ca"</strong> trên điện thoại, báo cáo sẽ tự động ghi vào 1 file Google Sheet chung của nhà máy và ca tiếp theo sẽ tự động nhận Tồn đầu!
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                URL Ứng Dụng Web Google Sheet (Apps Script Webhook):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.googleSheetUrl || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, googleSheetUrl: e.target.value.trim() });
                    setTestSheetStatus('idle');
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleTestGoogleSheet}
                  disabled={testSheetStatus === 'testing'}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm"
                >
                  {testSheetStatus === 'testing' ? 'Đang thử...' : 'Thử kết nối'}
                </button>
              </div>
            </div>

            {testSheetStatus === 'success' && (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {testSheetMsg}
              </p>
            )}
            {testSheetStatus === 'error' && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {testSheetMsg}
              </p>
            )}

            {/* Hướng dẫn tạo kết nối trong 1 phút */}
            <div className="bg-white p-3 rounded-lg border border-emerald-200 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-emerald-900 flex items-center gap-1">
                  ⚡ Cách kết nối file Google Sheet (Chỉ làm 1 lần trong 1 phút):
                </strong>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold text-[10px] flex items-center gap-1 transition-colors"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedScript ? 'Đã sao chép!' : 'Sao chép Mã Script'}
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                <li>Tạo 1 trang tính mới trên <code>sheets.google.com</code>.</li>
                <li>Vào menu <strong>Tiện ích mở rộng $\rightarrow$ Apps Script</strong>.</li>
                <li>Bấm <strong>Sao chép Mã Script</strong> ở trên và dán đè vào màn hình Apps Script.</li>
                <li>Bấm <strong>Triển khai $\rightarrow$ Tùy chọn triển khai mới $\rightarrow$ Ứng dụng web</strong> (chọn quyền truy cập: <em>Bất kỳ ai</em>) $\rightarrow$ Sao chép URL dán vào ô trên!</li>
              </ol>
            </div>
          </div>

          {/* Section 2: Gemini API Key */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-blue-600" />
                Google Gemini API Key (Đọc Ảnh Cân)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 underline"
              >
                Lấy Key Miễn Phí
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={formData.geminiApiKey}
                onChange={(e) => {
                  setFormData({ ...formData, geminiApiKey: e.target.value.trim() });
                  setTestStatus('idle');
                }}
                placeholder="AIzaSy... (Để trống nếu đã cài trên Vercel/.env)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testStatus === 'testing'}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                {testStatus === 'testing' ? 'Đang thử...' : 'Kiểm tra'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 <strong>Lưu ý:</strong> Nếu đã cài biến <code>GEMINI_API_KEY</code> trên Vercel hoặc file <code>.env</code>, bạn có thể để trống ô này. Máy chủ sẽ tự động xử lý an toàn mà không cần nhập lại trên điện thoại.
            </p>

            {testStatus === 'success' && (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                {testMessage}
              </p>
            )}
            {testStatus === 'error' && (
              <p className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {testMessage}
              </p>
            )}
          </div>

          {/* Section 3: Factory & Operator info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Thông Tin Báo Cáo Mặc Định
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Tên Công Ty</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Nhân Viên Cân Mặc Định</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.defaultOperator}
                    onChange={(e) => setFormData({ ...formData, defaultOperator: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Mã Section Biểu Mẫu</label>
                <input
                  type="text"
                  value={formData.defaultSection}
                  onChange={(e) => setFormData({ ...formData, defaultSection: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Revision</label>
                <input
                  type="text"
                  value={formData.defaultRevision}
                  onChange={(e) => setFormData({ ...formData, defaultRevision: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30"
          >
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};
