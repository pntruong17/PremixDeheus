export interface PremixItem {
  id: string;
  code: string; // Mã nguyên liệu (vd: 1101281, 1404060, 2303010...)
  name: string; // Tên nguyên liệu (vd: AQUALYSO STD, Muối, CHOLINE CHLORID 60...)
  category?: string;
  defaultWeight: number; // kg
  unit: 'kg' | 'g';
  bagPackagingKg?: number; // Quy cách đóng bao (vd: 25kg, 20kg, 50kg)
  tolerancePercent?: number; // Dung sai %
  defaultOpeningStock?: number; // Tồn đầu mặc định
  defaultLotNumber?: string; // Số lô mặc định
  description?: string;
  pageNumber?: number; // Số trang báo cáo giấy (1, 2, 3, 4)
}

export interface PremixHandoverRow {
  id: string;
  code: string; // Code nguyên liệu
  name: string; // Tên nguyên liệu
  openingStock: number; // Tồn đầu KG
  receivedQty: number; // SL nhận (KG) lấy từ kho ra
  
  // Dữ liệu bóc tách từ 2 cân (Cân Tôm & Cân Cá)
  shrimpTheory?: number; // Lý thuyết cân tôm
  shrimpActual?: number; // Thực tế cân tôm
  fishTheory?: number; // Lý thuyết cân cá
  fishActual?: number; // Thực tế cân cá

  theoryExpression: string; // Số lượng sử dụng LÝ THUYẾT (KG), vd: "18 + 24" hoặc "8"
  theoryTotal: number; // Tổng lý thuyết (kg)
  actualExpression: string; // Số lượng sử dụng THỰC TẾ (KG), vd: "17.98 + 23.97" hoặc "8.01"
  actualTotal: number; // Tổng thực tế (kg)
  closingStock: number; // Tồn cuối KG = Tồn đầu + SL nhận - Thực tế
  lotNumber: string; // Số lô (vd: 030826 PO - 1147 - RMR 2)
  diff: number; // Thực tế - Lý thuyết
  diffPercent: number;
  isWithinTolerance: boolean;
  needsWarehouseReceipt?: boolean; // Cảnh báo thiếu tồn đầu cần nhận kho
  suggestedReceiptQty?: number; // Gợi ý số kg cần nhận (theo số bao 25kg)
  notes?: string;
  pageNumber?: number; // Trang 1, 2, 3, 4
}

export interface ShiftInfo {
  date: string; // Ngày ghi báo cáo (vd: 26/08/2026)
  timeRange: string; // Giờ làm việc (vd: 07h30 -> 15h30)
  shiftNumber: string; // Ca sx (vd: 1, 2, 3...)
  operatorName: string; // Nhân viên cân (vd: T. Trường)
  supervisorName?: string;
  sectionCode: string; // Section: 03F26
  revision: string; // Revision: 01
  formDate: string; // Date: 23/12/2025
  companyName: string; // De Heus
  notes?: string;
}

export interface HandoverReport {
  id: string;
  shiftInfo: ShiftInfo;
  rows: PremixHandoverRow[];
  totalOpeningStockKg: number;
  totalReceivedKg: number;
  totalTheoryUsedKg: number;
  totalActualUsedKg: number;
  totalClosingStockKg: number;
  totalDiffKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  companyName: string;
  defaultOperator: string;
  defaultTimeRange: string;
  defaultSection: string;
  defaultRevision: string;
  defaultTolerancePercent: number;
  googleSheetUrl?: string; // URL Google Apps Script Web App để đồng bộ Google Sheet
  autoSyncSheet?: boolean; // Tự động đồng bộ lên Google Sheet khi nộp ca
}
