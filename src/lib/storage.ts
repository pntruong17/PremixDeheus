import { AppSettings, PremixItem, PremixHandoverRow, ShiftInfo, HandoverReport } from '../types';
import { DEFAULT_PREMIX_LIST, createInitialHandoverRows } from './defaultPremixData';

const KEYS = {
  PREMIX_CATALOG: 'premix_deheus_catalog',
  CURRENT_ROWS: 'premix_deheus_current_rows',
  CURRENT_SHIFT_INFO: 'premix_deheus_shift_info',
  SHIFT_HISTORY: 'premix_deheus_history',
  APP_SETTINGS: 'premix_deheus_settings',
  AUTO_RECEIPT_ENABLED: 'premix_deheus_auto_receipt',
  LAST_SUBMITTED_REPORT: 'premix_deheus_last_submitted',
  IS_ADMIN_SESSION: 'premix_deheus_is_admin',
  OPERATORS_LIST: 'premix_deheus_operators_list',
};

export const DEFAULT_OPERATORS_LIST: string[] = [
  'T.Trường',
  'N.Trường',
  'Phong',
  'Kiệt',
  'Khải',
  'Minh',
  'Phương',
];

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.6-flash',
  companyName: 'De Heus Animal Nutrition',
  defaultOperator: 'T.Trường',
  defaultTimeRange: '07h30 -> 15h30',
  defaultSection: '03F26',
  defaultRevision: '01',
  defaultTolerancePercent: 0.5,
  adminPin: '20000',
  operatorsList: DEFAULT_OPERATORS_LIST,
};

/**
 * Lấy quy cách đóng bao chuẩn của từng loại nguyên liệu:
 * - Mycelium: 850kg (túi lớn)
 * - Aqualyso: 20kg
 * - Tryptophane: 20kg
 * - Muối (Dry Salt): 50kg
 * - Bột đầu cá cơm: 50kg
 * - Tất cả loại khác: 25kg
 */
export function getPremixBagSize(code?: string, name?: string, catalog: PremixItem[] = DEFAULT_PREMIX_LIST): number {
  const cleanName = (name || '').toLowerCase();
  const cleanCode = (code || '').toLowerCase();

  // 1. Kiểm tra catalog tùy chỉnh người dùng trước
  const matched = catalog.find(c => (code && c.code.toLowerCase() === cleanCode) || (name && c.name.toLowerCase() === cleanName));
  if (matched?.bagPackagingKg && matched.bagPackagingKg > 0) {
    return matched.bagPackagingKg;
  }

  // 2. Quy cách mặc định đặc thù
  if (cleanName.includes('mycelium') || cleanName.includes('stimmunoguard') || cleanCode === '2404010') {
    return 850; // Túi lớn 850kg
  }
  if (cleanName.includes('aqualyso') || cleanCode === '1404060') {
    return 20; // Bao 20kg
  }
  if (cleanName.includes('tryptophane') || cleanCode === '3204010' || cleanCode === '1401040') {
    return 20; // Bao 20kg
  }
  if (cleanName.includes('muối') || cleanName.includes('muoi') || cleanName.includes('salt') || cleanCode === '2303010') {
    return 50; // Bao 50kg
  }
  if (cleanName.includes('cá cơm') || cleanName.includes('ca com') || cleanCode === '1201010') {
    return 50; // Bao 50kg
  }

  return 25; // Mặc định tất cả các loại khác là 25kg
}

/**
 * Thuật toán TỰ ĐỘNG TÍNH SỐ LƯỢNG NHẬN KHO (SL Nhận):
 * Tồn cuối C = O + R - U phải thoả mãn 0 <= C < BagSize
 * (Trong đó U là số lượng sử dụng Lý Thuyết)
 */
export function calculateAutoWarehouseReceipt(
  openingStock: number,
  usedWeight: number,
  bagSize: number
): {
  receivedQty: number;
  bagCount: number;
  closingStock: number;
} {
  const O = Number(openingStock) || 0;
  const U = Number(usedWeight) || 0;
  const B = Number(bagSize) || 25;

  if (U <= 0 || O >= U) {
    return {
      receivedQty: 0,
      bagCount: 0,
      closingStock: Number((O - U).toFixed(3)),
    };
  }

  const shortage = U - O;
  const bagCount = Math.ceil(shortage / B);
  const receivedQty = bagCount * B;
  const closingStock = Number((O + receivedQty - U).toFixed(3));

  return {
    receivedQty,
    bagCount,
    closingStock,
  };
}

/**
 * Tính tổng từ chuỗi biểu thức như "18 + 24", "5 + 2" hoặc "17.98 + 23.97"
 */
export function evaluateExpression(expr: string | number | undefined): number {
  if (expr === undefined || expr === null) return 0;
  if (typeof expr === 'number') return isNaN(expr) ? 0 : expr;
  if (typeof expr !== 'string') return 0;
  
  const clean = expr.trim();
  if (!clean) return 0;

  try {
    const parts = clean.split('+').map(p => p.trim()).filter(Boolean);
    const sum = parts.reduce((acc, part) => {
      const numStr = part.replace(',', '.').replace(/[^0-9.-]/g, '');
      const val = parseFloat(numStr);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return Number(sum.toFixed(3));
  } catch (e) {
    return 0;
  }
}

/**
 * Tính toán tự động cho 1 dòng nguyên liệu:
 * TỒN CUỐI = Tồn đầu + SL Nhận - SỬ DỤNG LÝ THUYẾT
 */
export function recalculateRow(
  row: PremixHandoverRow,
  tolerancePercent: number = 0.5,
  autoDecideReceipt: boolean = true,
  catalog: PremixItem[] = DEFAULT_PREMIX_LIST
): PremixHandoverRow {
  const theoryTotal = evaluateExpression(row.theoryExpression);
  const actualTotal = evaluateExpression(row.actualExpression);
  const opening = Number(row.openingStock) || 0;
  
  const bagSize = getPremixBagSize(row.code, row.name, catalog);

  let received = Number(row.receivedQty) || 0;

  if (autoDecideReceipt) {
    const autoCalc = calculateAutoWarehouseReceipt(opening, theoryTotal, bagSize);
    received = autoCalc.receivedQty;
  }

  // Tồn cuối = Tồn đầu + SL Nhận - LÝ THUYẾT (trừ ra cho số lượng lý thuyết)
  const closingStock = Number((opening + received - theoryTotal).toFixed(3));
  const diff = Number((actualTotal - theoryTotal).toFixed(3));
  const diffPercent = theoryTotal > 0 ? Number(((diff / theoryTotal) * 100).toFixed(2)) : 0;
  const isWithinTolerance = theoryTotal === 0 ? true : Math.abs(diffPercent) <= tolerancePercent;

  const effectiveAvailable = opening + received;
  const needsWarehouseReceipt = theoryTotal > 0 && effectiveAvailable < theoryTotal;
  
  let suggestedReceiptQty = 0;
  if (needsWarehouseReceipt) {
    const shortage = theoryTotal - opening;
    const numBags = Math.ceil(shortage / bagSize);
    suggestedReceiptQty = Math.max(numBags * bagSize, bagSize);
  }

  return {
    ...row,
    receivedQty: received,
    theoryTotal,
    actualTotal,
    closingStock,
    diff,
    diffPercent,
    isWithinTolerance,
    needsWarehouseReceipt,
    suggestedReceiptQty,
  };
}

/**
 * Ghép số liệu giữa 2 tháp cân (Cân Tôm & Cân Cá) thành biểu thức cộng dồn: "18 + 24"
 */
export function formatTowerExpression(shrimpVal?: number, fishVal?: number): {
  expression: string;
  total: number;
} {
  const s = (shrimpVal !== undefined && shrimpVal > 0) ? shrimpVal : 0;
  const f = (fishVal !== undefined && fishVal > 0) ? fishVal : 0;

  if (s > 0 && f > 0) {
    return {
      expression: `${s} + ${f}`,
      total: Number((s + f).toFixed(3)),
    };
  }
  if (s > 0) {
    return {
      expression: `${s}`,
      total: s,
    };
  }
  if (f > 0) {
    return {
      expression: `${f}`,
      total: f,
    };
  }
  return { expression: '', total: 0 };
}

/**
 * Tính tổng hợp toàn bộ bảng giao ca
 */
export function calculateReportTotals(rows: PremixHandoverRow[]): {
  totalOpeningStockKg: number;
  totalReceivedKg: number;
  totalTheoryUsedKg: number;
  totalActualUsedKg: number;
  totalClosingStockKg: number;
  totalDiffKg: number;
  activeRowCount: number;
  errorRowCount: number;
  shortageRowCount: number;
} {
  let totalOpeningStockKg = 0;
  let totalReceivedKg = 0;
  let totalTheoryUsedKg = 0;
  let totalActualUsedKg = 0;
  let totalClosingStockKg = 0;
  let totalDiffKg = 0;
  let activeRowCount = 0;
  let errorRowCount = 0;
  let shortageRowCount = 0;

  rows.forEach(r => {
    totalOpeningStockKg += r.openingStock || 0;
    totalReceivedKg += r.receivedQty || 0;
    totalTheoryUsedKg += r.theoryTotal || 0;
    totalActualUsedKg += r.actualTotal || 0;
    totalClosingStockKg += r.closingStock || 0;
    totalDiffKg += r.diff || 0;

    if (r.actualTotal > 0 || r.theoryTotal > 0 || r.receivedQty > 0) {
      activeRowCount++;
    }
    if (!r.isWithinTolerance && r.theoryTotal > 0) {
      errorRowCount++;
    }
    if (r.needsWarehouseReceipt) {
      shortageRowCount++;
    }
  });

  return {
    totalOpeningStockKg: Number(totalOpeningStockKg.toFixed(3)),
    totalReceivedKg: Number(totalReceivedKg.toFixed(3)),
    totalTheoryUsedKg: Number(totalTheoryUsedKg.toFixed(3)),
    totalActualUsedKg: Number(totalActualUsedKg.toFixed(3)),
    totalClosingStockKg: Number(totalClosingStockKg.toFixed(3)),
    totalDiffKg: Number(totalDiffKg.toFixed(3)),
    activeRowCount,
    errorRowCount,
    shortageRowCount,
  };
}

/**
 * 🔄 BÀN GIAO SANG CA TIẾP THEO (Handover to Next Shift):
 * Quy tắc:
 * 1. Tồn cuối ca trước => Tồn đầu ca mới
 * 2. Reset các cột Sử dụng (Lý thuyết, Thực tế, SL nhận) về 0
 * 3. Tự động tăng số Ca (Ca 1 -> Ca 2 -> Ca 3 -> Ca 1 ngày hôm sau)
 * 4. Cập nhật khung giờ mặc định tương ứng với Ca mới
 */
export function prepareNextShiftData(
  currentReport: HandoverReport,
  catalog: PremixItem[] = DEFAULT_PREMIX_LIST
): {
  nextShiftInfo: ShiftInfo;
  nextRows: PremixHandoverRow[];
} {
  const curShiftNum = parseInt(currentReport.shiftInfo.shiftNumber || '1', 10);
  let nextShiftNum = curShiftNum + 1;
  let nextDate = currentReport.shiftInfo.date;
  let nextTimeRange = '07h30 -> 15h30';

  if (nextShiftNum > 3) {
    nextShiftNum = 1;
    // Chuyển sang ngày tiếp theo nếu từ ca 3 sang ca 1
    try {
      const parts = (currentReport.shiftInfo.date || '').split(/[\/\-]/);
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const nextD = new Date(y, m, d + 1);
        const dayStr = String(nextD.getDate()).padStart(2, '0');
        const monthStr = String(nextD.getMonth() + 1).padStart(2, '0');
        nextDate = `${dayStr}/${monthStr}/${nextD.getFullYear()}`;
      }
    } catch (e) {
      console.error('Error calculating next date:', e);
    }
  }

  // Khung giờ theo từng ca
  if (nextShiftNum === 1) nextTimeRange = '06h00 -> 14h00';
  else if (nextShiftNum === 2) nextTimeRange = '14h00 -> 22h00';
  else if (nextShiftNum === 3) nextTimeRange = '22h00 -> 06h00 (hoặc 07h30 -> 15h30)';

  const nextShiftInfo: ShiftInfo = {
    ...currentReport.shiftInfo,
    shiftNumber: String(nextShiftNum),
    date: nextDate,
    timeRange: nextTimeRange,
    notes: `Bàn giao từ Ca ${curShiftNum}`,
  };

  // Chuyển Tồn cuối của ca hiện tại thành Tồn đầu của ca mới
  const nextRows: PremixHandoverRow[] = currentReport.rows.map((row) => {
    const carryOverOpening = Number(row.closingStock) || 0;
    return recalculateRow(
      {
        ...row,
        openingStock: carryOverOpening,
        receivedQty: 0,
        shrimpTheory: undefined,
        shrimpActual: undefined,
        fishTheory: undefined,
        fishActual: undefined,
        theoryExpression: '',
        theoryTotal: 0,
        actualExpression: '',
        actualTotal: 0,
        closingStock: carryOverOpening,
        diff: 0,
        diffPercent: 0,
        isWithinTolerance: true,
        needsWarehouseReceipt: false,
        suggestedReceiptQty: 0,
      },
      0.5,
      false,
      catalog
    );
  });

  return {
    nextShiftInfo,
    nextRows,
  };
}

// === CATALOG ===
export function getStoredCatalog(): PremixItem[] {
  if (typeof window === 'undefined') return DEFAULT_PREMIX_LIST;
  try {
    const raw = localStorage.getItem(KEYS.PREMIX_CATALOG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading catalog:', e);
  }
  return DEFAULT_PREMIX_LIST;
}

export function saveCatalog(catalog: PremixItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.PREMIX_CATALOG, JSON.stringify(catalog));
}

// === CURRENT ROWS ===
export function getStoredCurrentRows(catalog: PremixItem[] = DEFAULT_PREMIX_LIST): PremixHandoverRow[] {
  if (typeof window === 'undefined') return createInitialHandoverRows(catalog);
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_ROWS);
    if (raw) {
      const parsed: PremixHandoverRow[] = JSON.parse(raw);
      const rowByCode = new Map<string, PremixHandoverRow>();
      const rowByName = new Map<string, PremixHandoverRow>();
      parsed.forEach((r) => {
        if (r.code) rowByCode.set(r.code.trim().toLowerCase(), r);
        if (r.name) rowByName.set(r.name.trim().toLowerCase(), r);
      });

      // Tự động bảo đảm đầy đủ 100% tất cả các loại trong catalog, đúng thứ tự chuẩn
      return catalog.map((item) => {
        const itemCodeKey = (item.code || '').trim().toLowerCase();
        const itemNameKey = (item.name || '').trim().toLowerCase();
        const existing = (itemCodeKey && rowByCode.get(itemCodeKey)) || rowByName.get(itemNameKey);

        if (existing) {
          return recalculateRow(
            {
              ...existing,
              id: existing.id || `row-${item.id}`,
              code: item.code,
              name: item.name,
              pageNumber: item.pageNumber,
            },
            0.5,
            false,
            catalog
          );
        }

        const opening = item.defaultOpeningStock || 0;
        return {
          id: `row-${item.id}`,
          code: item.code,
          name: item.name,
          openingStock: opening,
          receivedQty: 0,
          theoryExpression: '',
          theoryTotal: 0,
          actualExpression: '',
          actualTotal: 0,
          closingStock: opening,
          lotNumber: item.defaultLotNumber || '',
          diff: 0,
          diffPercent: 0,
          isWithinTolerance: true,
          needsWarehouseReceipt: false,
          suggestedReceiptQty: 0,
          pageNumber: item.pageNumber,
          notes: '',
        };
      });
    }
  } catch (e) {
    console.error('Error reading current rows:', e);
  }
  return createInitialHandoverRows(catalog);
}

export function saveCurrentRows(rows: PremixHandoverRow[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.CURRENT_ROWS, JSON.stringify(rows));
}

// === AUTO RECEIPT TOGGLE ===
export function getStoredAutoReceipt(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(KEYS.AUTO_RECEIPT_ENABLED);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading auto receipt setting:', e);
  }
  return true;
}

export function saveAutoReceipt(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.AUTO_RECEIPT_ENABLED, JSON.stringify(enabled));
}

// === CURRENT SHIFT INFO ===
export function getStoredShiftInfo(): ShiftInfo {
  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dateFormatted = `${dayStr}/${monthStr}/${today.getFullYear()}`;

  const defaultInfo: ShiftInfo = {
    date: dateFormatted,
    timeRange: '07h30 -> 15h30',
    shiftNumber: '1',
    operatorName: 'T. Trường',
    sectionCode: '03F26',
    revision: '01',
    formDate: '23/12/2025',
    companyName: 'De Heus',
    notes: '',
  };
  if (typeof window === 'undefined') return defaultInfo;
  try {
    const raw = localStorage.getItem(KEYS.CURRENT_SHIFT_INFO);
    if (raw) {
      return { ...defaultInfo, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading shift info:', e);
  }
  return defaultInfo;
}

export function saveShiftInfo(info: ShiftInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.CURRENT_SHIFT_INFO, JSON.stringify(info));
}

// === HISTORY ===
export function getStoredHistory(): HandoverReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEYS.SHIFT_HISTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading history:', e);
  }
  return [];
}

export function saveReportToHistory(report: HandoverReport): void {
  if (typeof window === 'undefined') return;
  const history = getStoredHistory();
  const existingIdx = history.findIndex(h => h.id === report.id);
  if (existingIdx >= 0) {
    history[existingIdx] = report;
  } else {
    history.unshift(report);
  }
  localStorage.setItem(KEYS.SHIFT_HISTORY, JSON.stringify(history));
  localStorage.setItem(KEYS.LAST_SUBMITTED_REPORT, JSON.stringify(report));
}

export function getLastSubmittedReport(): HandoverReport | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.LAST_SUBMITTED_REPORT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading last submitted report:', e);
  }
  return null;
}

export function deleteReportFromHistory(id: string): void {
  if (typeof window === 'undefined') return;
  const history = getStoredHistory().filter(h => h.id !== id);
  localStorage.setItem(KEYS.SHIFT_HISTORY, JSON.stringify(history));
}

// === SETTINGS ===
export function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.APP_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.adminPin === '6322') {
        parsed.adminPin = '20000';
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.APP_SETTINGS, JSON.stringify(settings));
}

// === ADMIN AUTH SESSION ===
export function getStoredIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEYS.IS_ADMIN_SESSION) === 'true';
  } catch (e) {
    return false;
  }
}

export function saveStoredIsAdmin(isAdmin: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.IS_ADMIN_SESSION, isAdmin ? 'true' : 'false');
}

// === OPERATORS LIST ===
export function getStoredOperatorsList(): string[] {
  if (typeof window === 'undefined') return DEFAULT_OPERATORS_LIST;
  try {
    const raw = localStorage.getItem(KEYS.OPERATORS_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading operators list:', e);
  }
  return DEFAULT_OPERATORS_LIST;
}

export function saveStoredOperatorsList(list: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.OPERATORS_LIST, JSON.stringify(list));
}

/**
 * Khớp tên/code nguyên liệu De Heus từ kết quả AI
 */
export function matchPremixFromCatalog(rawText: string, catalog: PremixItem[]): PremixItem | undefined {
  if (!rawText) return undefined;
  const clean = rawText.toLowerCase().replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ\s]/g, ' ').trim();

  const exactCode = catalog.find(c => c.code.toLowerCase() === clean || clean.includes(c.code.toLowerCase()));
  if (exactCode) return exactCode;

  const exactName = catalog.find(c => clean.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(clean));
  if (exactName) return exactName;

  const keyMap: { [k: string]: string } = {
    'aqualyso': '1404060',
    'x-soy': '1101281',
    'xsoy': '1101281',
    'soytide': '1101330',
    'cholesterol': '1409010',
    'mcp': '2302010',
    'muối': '2303010',
    'muoi': '2303010',
    'dry salt': '2303010',
    'potassium': '2305010',
    'mycelium': '2404010',
    'stimmunoguard': '2404010',
    'selsaf': '2592',
    'choline': '3015020',
    'betain': '3016010',
    'cá cơm': '1201010',
    'ca com': '1201010',
    'cơm': '1201010',
    'yuxiabao': '3016500',
    'taurine': '3020010',
    'b-traxim': '3103250',
    'mn-oxide': '3104015',
    'lysine': '3201050',
    'methionine': '3202010',
    'threonine': '3203010',
    'tryptophane': '3204010',
    'arginine': '3205010',
    'gaa': '3206015',
    'guanidinoacetic': '3206015',
    'ag 175': '3310030',
    'carophyll yellow': '3602100',
    'menogold': '3605140',
    'toxifix': '4003150',
    'zeolite': '4003150',
    'calcium propionate': '4603030',
    'tributyrin': '4606610',
    'so-mate': '4613010',
    'sodium humate': '4613010',
    'kelenon': '4616010',
    'bile acid': '4616010',
    'picolinate': '3101067',
    'novinox': '101129',
    'mg oxide': '101137',
    'carophyll red': '01148',
    'lime fine': '01150',
    'leader yellow': '6101160',
    'sắc tố vàng': '6101160',
    'vitamin premix': '6101470',
    'mineral premix': '6101471',
    'shrimp premix': '6101472',
    'ext premix': '6101474',
    'health premix': '6101488',
    't.b biến tính': '1102010',
    'tinh bột': '1102010',
    'protide': '1202010',
  };

  for (const kw in keyMap) {
    if (clean.includes(kw)) {
      const code = keyMap[kw];
      const match = catalog.find(c => c.code === code);
      if (match) return match;
    }
  }

  return undefined;
}
