'use client';

import React, { useState } from 'react';
import { PremixItem } from '../types';
import { exportCatalogToExcel } from '../lib/excelExport';
import { DEFAULT_PREMIX_LIST } from '../lib/defaultPremixData';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  RotateCcw,
  Check,
  X,
  Layers,
  Tag,
  Package,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';

interface PremixCatalogProps {
  catalog: PremixItem[];
  onUpdateCatalog: (newCatalog: PremixItem[]) => void;
}

export const PremixCatalog: React.FC<PremixCatalogProps> = ({
  catalog,
  onUpdateCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<PremixItem>>({
    code: '',
    name: '',
    category: 'Chung',
    pageNumber: 1,
    defaultWeight: 10,
    unit: 'kg',
    bagPackagingKg: 25,
    tolerancePercent: 0.5,
    description: '',
  });

  const categories = Array.from(new Set(catalog.map((i) => i.category || 'Chung')));

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // --- REORDER HANDLERS ---
  const handleMove = (id: string, delta: number) => {
    const fromIndex = catalog.findIndex((i) => i.id === id);
    if (fromIndex === -1) return;
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= catalog.length) return;

    const newCatalog = [...catalog];
    const [moved] = newCatalog.splice(fromIndex, 1);
    newCatalog.splice(toIndex, 0, moved);
    onUpdateCatalog(newCatalog);
  };

  const handleJumpToPosition = (id: string, targetPos1Based: number) => {
    if (isNaN(targetPos1Based) || targetPos1Based < 1) return;
    const fromIndex = catalog.findIndex((i) => i.id === id);
    if (fromIndex === -1) return;
    const toIndex = Math.max(0, Math.min(catalog.length - 1, Math.round(targetPos1Based) - 1));
    if (fromIndex === toIndex) return;

    const newCatalog = [...catalog];
    const [moved] = newCatalog.splice(fromIndex, 1);
    newCatalog.splice(toIndex, 0, moved);
    onUpdateCatalog(newCatalog);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== targetId) {
      setDragOverId(targetId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) {
      const fromIndex = catalog.findIndex((i) => i.id === draggedId);
      const toIndex = catalog.findIndex((i) => i.id === targetId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const newCatalog = [...catalog];
        const [moved] = newCatalog.splice(fromIndex, 1);
        newCatalog.splice(toIndex, 0, moved);
        onUpdateCatalog(newCatalog);
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleSaveItem = () => {
    if (!editingItem.name || !editingItem.code) {
      alert('Vui lòng nhập Mã Premix và Tên Loại Premix.');
      return;
    }

    if (editingItem.id) {
      const updated = catalog.map((item) =>
        item.id === editingItem.id ? ({ ...item, ...editingItem } as PremixItem) : item
      );
      onUpdateCatalog(updated);
    } else {
      const newItem: PremixItem = {
        id: `pm-${Date.now()}`,
        code: editingItem.code.toUpperCase().trim(),
        name: editingItem.name.trim(),
        category: editingItem.category || 'Chung',
        pageNumber: Number(editingItem.pageNumber) || 1,
        defaultWeight: Number(editingItem.defaultWeight) || 0,
        unit: (editingItem.unit as any) || 'kg',
        bagPackagingKg: Number(editingItem.bagPackagingKg) || 25,
        tolerancePercent: Number(editingItem.tolerancePercent) || 0.5,
        description: editingItem.description || '',
      };
      onUpdateCatalog([newItem, ...catalog]);
    }

    setIsEditing(false);
    setEditingItem({
      code: '',
      name: '',
      category: 'Chung',
      pageNumber: 1,
      defaultWeight: 10,
      unit: 'kg',
      bagPackagingKg: 25,
      tolerancePercent: 0.5,
      description: '',
    });
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa loại premix này khỏi danh mục?')) {
      onUpdateCatalog(catalog.filter((i) => i.id !== id));
    }
  };

  const handleResetDefault = () => {
    if (confirm('Khôi phục danh mục mẫu chuẩn gồm 43 loại Premix theo 4 trang giấy De Heus?')) {
      onUpdateCatalog(DEFAULT_PREMIX_LIST);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Danh Mục 43 Loại Premix & Quy Cách Đóng Bao ({catalog.length} loại)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bạn có thể tự do chỉnh sửa quy cách bao và thay đổi vị trí của từng loại để làm chuẩn cho báo cáo chính thức!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingItem({
                  code: '',
                  name: '',
                  category: 'Chung',
                  pageNumber: 1,
                  defaultWeight: 10,
                  unit: 'kg',
                  bagPackagingKg: 25,
                  tolerancePercent: 0.5,
                  description: '',
                });
                setIsEditing(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Thêm Loại Mới
            </button>

            <button
              type="button"
              onClick={() => exportCatalogToExcel(catalog)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              title="Khôi phục danh mục mẫu 43 loại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục mẫu 43 loại
            </button>
          </div>
        </div>

        {/* Tip Box for Reordering */}
        <div className="mt-3.5 bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Đổi vị trí nguyên liệu:</strong> Nắm vào biểu tượng <code className="bg-blue-100 px-1 py-0.5 rounded font-bold">⠿</code> để kéo thả, dùng nút <span className="font-bold">⬆️ ⬇️</span> hoặc <strong>nhập trực tiếp số vị trí</strong> vào ô STT. Vị trí ở đây sẽ tự động làm chuẩn cho <strong>Báo cáo hàng ngày</strong>!
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, tên hoặc mô tả nguyên liệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả nhóm nguyên liệu ({catalog.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Edit / Create Form Modal */}
      {isEditing && (
        <div className="p-4 sm:p-6 bg-blue-50/70 border-b-2 border-blue-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              {editingItem.id ? 'Chỉnh Sửa Thông Tin & Quy Cách Bao' : 'Thêm Nguyên Liệu Premix Mới'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Mã Nguyên Liệu (Code) *</label>
              <input
                type="text"
                value={editingItem.code || ''}
                onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                placeholder="VD: 1404060"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên Nguyên Liệu *</label>
              <input
                type="text"
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                placeholder="VD: AQUALYSO STD"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-blue-900 mb-1">
                📦 Quy Cách Đóng Bao (KG) *
              </label>
              <input
                type="number"
                step="1"
                value={editingItem.bagPackagingKg || 25}
                onChange={(e) => setEditingItem({ ...editingItem, bagPackagingKg: parseFloat(e.target.value) || 25 })}
                placeholder="25"
                className="w-full bg-white border-2 border-blue-300 rounded px-2.5 py-1.5 font-mono font-black text-blue-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-[10px] text-slate-400">VD: 20kg, 25kg, 50kg hoặc 850kg (túi)</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Trang Báo Cáo (1 - 4)</label>
              <select
                value={editingItem.pageNumber || 1}
                onChange={(e) => setEditingItem({ ...editingItem, pageNumber: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value={1}>Trang 1</option>
                <option value={2}>Trang 2</option>
                <option value={3}>Trang 3</option>
                <option value={4}>Trang 4</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nhóm</label>
              <input
                type="text"
                value={editingItem.category || ''}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                placeholder="VD: Trang 1 - Phụ gia"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tồn Đầu Mặc Định (KG)</label>
              <input
                type="number"
                step="0.01"
                value={editingItem.defaultOpeningStock || 0}
                onChange={(e) => setEditingItem({ ...editingItem, defaultOpeningStock: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Lô Mặc Định</label>
              <input
                type="text"
                value={editingItem.defaultLotNumber || ''}
                onChange={(e) => setEditingItem({ ...editingItem, defaultLotNumber: e.target.value })}
                placeholder="Số PO..."
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Mô tả / Chức năng</label>
              <input
                type="text"
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Mô tả nguyên liệu..."
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Check className="w-4 h-4" />
              Lưu Thông Tin
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-800 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-2 w-28 text-center bg-blue-50/50 text-blue-950">
                Thứ Tự (STT)
              </th>
              <th className="py-3 px-3 w-14 text-center">Trang</th>
              <th className="py-3 px-3 w-24">Mã Code</th>
              <th className="py-3 px-4 min-w-[200px]">Tên loại Premix</th>
              <th className="py-3 px-3 w-32 text-center bg-blue-50/60 text-blue-900">
                📦 Quy cách đóng bao
              </th>
              <th className="py-3 px-3 min-w-[140px]">Nhóm</th>
              <th className="py-3 px-3 min-w-[180px]">Số lô mặc định</th>
              <th className="py-3 px-3 min-w-[180px]">Mô tả</th>
              <th className="py-3 px-3 w-20 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCatalog.map((item) => {
              const actualIndex = catalog.findIndex((i) => i.id === item.id);
              const positionNumber = actualIndex + 1;
              const isFirst = actualIndex === 0;
              const isLast = actualIndex === catalog.length - 1;
              const isDragging = draggedId === item.id;
              const isDragOver = dragOverId === item.id && draggedId !== item.id;

              return (
                <tr
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${
                    isDragging
                      ? 'opacity-40 bg-blue-50'
                      : isDragOver
                      ? 'bg-blue-100 border-t-2 border-blue-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Cột Thứ Tự & Điều Khiển Vị Trí */}
                  <td className="py-2 px-2 bg-blue-50/20">
                    <div className="flex items-center justify-center gap-1">
                      {/* Drag Handle Icon */}
                      <span
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-blue-600 p-0.5"
                        title="Kéo & Thả để đổi vị trí"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>

                      {/* Ô nhập số thứ tự trực tiếp */}
                      <input
                        type="number"
                        min={1}
                        max={catalog.length}
                        defaultValue={positionNumber}
                        key={`${item.id}-${positionNumber}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            handleJumpToPosition(item.id, val);
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (val !== positionNumber) {
                            handleJumpToPosition(item.id, val);
                          }
                        }}
                        className="w-10 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded py-0.5 text-blue-950 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Nhập số thứ tự và nhấn Enter để chuyển nhanh vị trí"
                      />

                      {/* Nút Lên / Xuống */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMove(item.id, -1)}
                          className={`p-0.5 rounded transition-colors ${
                            isFirst
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-500 hover:text-blue-700 hover:bg-blue-100'
                          }`}
                          title="Di chuyển lên 1 dòng"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMove(item.id, 1)}
                          className={`p-0.5 rounded transition-colors ${
                            isLast
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-500 hover:text-blue-700 hover:bg-blue-100'
                          }`}
                          title="Di chuyển xuống 1 dòng"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                    T{item.pageNumber || 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                    {item.code}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-center bg-blue-50/30">
                    <span className="font-mono font-black text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                      {item.bagPackagingKg || 25} kg / {item.bagPackagingKg && item.bagPackagingKg >= 800 ? 'túi' : 'bao'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {item.category || 'Chung'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[180px]">
                    {item.defaultLotNumber || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[200px]" title={item.description}>
                    {item.description || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem({ ...item });
                          setIsEditing(true);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"
                        title="Chỉnh sửa quy cách bao hoặc tên"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Xóa loại này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
