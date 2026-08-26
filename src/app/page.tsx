'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ImageScanner } from '@/components/ImageScanner';
import { DataTable } from '@/components/DataTable';
import { SummaryReport } from '@/components/SummaryReport';
import { PremixCatalog } from '@/components/PremixCatalog';
import { HistoryView } from '@/components/HistoryView';
import { SettingsModal } from '@/components/SettingsModal';
import { HandoverModal } from '@/components/HandoverModal';
import { AdminAuthModal } from '@/components/AdminAuthModal';
import { OperatorManageModal } from '@/components/OperatorManageModal';
import { CheckCircle2, FileSpreadsheet, X, Sparkles, ArrowRight } from 'lucide-react';
import { PremixItem, PremixHandoverRow, ShiftInfo, HandoverReport, AppSettings, SheetSyncInfo } from '@/types';
import {
  getStoredCatalog,
  saveCatalog,
  getStoredCurrentRows,
  saveCurrentRows,
  getStoredShiftInfo,
  saveShiftInfo,
  getStoredHistory,
  saveReportToHistory,
  deleteReportFromHistory,
  getStoredSettings,
  saveSettings,
  calculateReportTotals,
  recalculateRow,
  matchPremixFromCatalog,
  formatTowerExpression,
  getStoredAutoReceipt,
  saveAutoReceipt,
  prepareNextShiftData,
  getLastSubmittedReport,
  getStoredIsAdmin,
  saveStoredIsAdmin,
  getStoredOperatorsList,
  saveStoredOperatorsList,
  DEFAULT_OPERATORS_LIST,
} from '@/lib/storage';
import { createInitialHandoverRows } from '@/lib/defaultPremixData';
import { fetchLatestStocksFromGoogleSheet } from '@/lib/googleSheet';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isOperatorManageOpen, setIsOperatorManageOpen] = useState(false);
  const [autoReceipt, setAutoReceipt] = useState(true);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);

  const [catalog, setCatalog] = useState<PremixItem[]>([]);
  const [rows, setRows] = useState<PremixHandoverRow[]>([]);
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo>(getStoredShiftInfo());
  const [history, setHistory] = useState<HandoverReport[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [operatorsList, setOperatorsList] = useState<string[]>(DEFAULT_OPERATORS_LIST);
  const [sheetSyncInfo, setSheetSyncInfo] = useState<SheetSyncInfo>({
    status: 'idle',
  });
  const [handoverSuccessBanner, setHandoverSuccessBanner] = useState<{
    prevShiftNumber: string;
    prevDate: string;
    newShiftNumber: string;
    newDate: string;
    totalClosingStock: number;
    prevReport: HandoverReport;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedCatalog = getStoredCatalog();
    const storedRows = getStoredCurrentRows(storedCatalog);
    const storedSettings = getStoredSettings();
    const storedOperators = getStoredOperatorsList();
    setOperatorsList(storedOperators);

    // Kiểm tra quyền Admin (qua localStorage hoặc query param ?admin=1 hoặc ?pin=...)
    const storedIsAdmin = getStoredIsAdmin();
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminParam = urlParams.get('admin') === 'true' || urlParams.get('admin') === '1';
    const pinParam = urlParams.get('pin');
    const isParamAdmin = hasAdminParam || (pinParam && pinParam === (storedSettings.adminPin || '20000'));
    const effectiveAdmin = storedIsAdmin || Boolean(isParamAdmin);

    setIsAdmin(effectiveAdmin);
    if (effectiveAdmin) saveStoredIsAdmin(true);

    // Sắp xếp rows theo đúng thứ tự storedCatalog làm chuẩn
    const codeOrderMap = new Map<string, number>();
    storedCatalog.forEach((item, idx) => {
      codeOrderMap.set(item.code, idx);
      codeOrderMap.set(item.name.toLowerCase().trim(), idx);
      codeOrderMap.set(item.id, idx);
    });

    const reorderedRows = [...storedRows].sort((a, b) => {
      const orderA = codeOrderMap.has(a.code)
        ? codeOrderMap.get(a.code)!
        : codeOrderMap.has(a.name.toLowerCase().trim())
        ? codeOrderMap.get(a.name.toLowerCase().trim())!
        : 9999;
      const orderB = codeOrderMap.has(b.code)
        ? codeOrderMap.get(b.code)!
        : codeOrderMap.has(b.name.toLowerCase().trim())
        ? codeOrderMap.get(b.name.toLowerCase().trim())!
        : 9999;
      return orderA - orderB;
    });

    setCatalog(storedCatalog);
    setRows(reorderedRows);
    setShiftInfo(getStoredShiftInfo());
    setHistory(getStoredHistory());
    setSettings(getStoredSettings());
    setAutoReceipt(getStoredAutoReceipt());

    // ⚡ CÁCH 2: TỰ ĐỘNG ĐỒNG BỘ TỒN ĐẦU TỪ GOOGLE SHEET NGAY KHI MỞ TRANG WEB
    syncStocksFromSheet(false, storedCatalog, reorderedRows, storedSettings);
  }, []);

  const totals = calculateReportTotals(rows);

  const currentReport: HandoverReport = {
    id: `report-${(shiftInfo.date || 'today').replace(/[\/\-]/g, '')}-Ca${shiftInfo.shiftNumber}`,
    shiftInfo,
    rows,
    totalOpeningStockKg: totals.totalOpeningStockKg,
    totalReceivedKg: totals.totalReceivedKg,
    totalTheoryUsedKg: totals.totalTheoryUsedKg,
    totalActualUsedKg: totals.totalActualUsedKg,
    totalClosingStockKg: totals.totalClosingStockKg,
    totalDiffKg: totals.totalDiffKg,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextShiftPreview = prepareNextShiftData(currentReport, catalog);

  const handleShiftInfoChange = (newInfo: ShiftInfo) => {
    setShiftInfo(newInfo);
    saveShiftInfo(newInfo);
  };

  const handleUpdateCatalog = (newCatalog: PremixItem[]) => {
    setCatalog(newCatalog);
    saveCatalog(newCatalog);

    // Đồng bộ thứ tự của các dòng trong báo cáo chính thức theo danh mục mới
    const codeOrderMap = new Map<string, number>();
    const catalogItemMap = new Map<string, PremixItem>();
    newCatalog.forEach((item, idx) => {
      codeOrderMap.set(item.code, idx);
      codeOrderMap.set(item.name.toLowerCase().trim(), idx);
      codeOrderMap.set(item.id, idx);
      catalogItemMap.set(item.code, item);
      catalogItemMap.set(item.id, item);
    });

    const reorderedRows = [...rows].sort((a, b) => {
      const orderA = codeOrderMap.has(a.code)
        ? codeOrderMap.get(a.code)!
        : codeOrderMap.has(a.name.toLowerCase().trim())
        ? codeOrderMap.get(a.name.toLowerCase().trim())!
        : 9999;
      const orderB = codeOrderMap.has(b.code)
        ? codeOrderMap.get(b.code)!
        : codeOrderMap.has(b.name.toLowerCase().trim())
        ? codeOrderMap.get(b.name.toLowerCase().trim())!
        : 9999;
      return orderA - orderB;
    });

    const finalRows = reorderedRows.map((r) => {
      const matched = catalogItemMap.get(r.code) || catalogItemMap.get(r.id);
      if (matched && matched.pageNumber !== undefined && matched.pageNumber !== r.pageNumber) {
        return { ...r, pageNumber: matched.pageNumber };
      }
      return r;
    });

    setRows(finalRows);
    saveCurrentRows(finalRows);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleToggleAutoReceipt = (enabled: boolean) => {
    setAutoReceipt(enabled);
    saveAutoReceipt(enabled);
    if (enabled) {
      const updated = rows.map((r) => recalculateRow(r, 0.5, true, catalog));
      setRows(updated);
      saveCurrentRows(updated);
    }
  };

  const handleRecalculateAllReceipts = () => {
    const updated = rows.map((r) => recalculateRow(r, 0.5, true, catalog));
    setRows(updated);
    saveCurrentRows(updated);
  };

  const handleUpdateRow = (id: string, updatedRow: PremixHandoverRow) => {
    const updated = rows.map((r) => (r.id === id ? updatedRow : r));
    setRows(updated);
    saveCurrentRows(updated);
  };

  const handleDeleteRow = (id: string) => {
    const updated = rows.filter((r) => r.id !== id);
    setRows(updated);
    saveCurrentRows(updated);
  };

  const handleAddRow = () => {
    const newRow: PremixHandoverRow = {
      id: `row-${Date.now()}`,
      code: '',
      name: '',
      openingStock: 0,
      receivedQty: 0,
      theoryExpression: '',
      theoryTotal: 0,
      actualExpression: '',
      actualTotal: 0,
      closingStock: 0,
      lotNumber: '',
      diff: 0,
      diffPercent: 0,
      isWithinTolerance: true,
      pageNumber: 1,
    };
    const updated = [...rows, newRow];
    setRows(updated);
    saveCurrentRows(updated);
  };

  const handleResetToDefaultList = () => {
    const initial = createInitialHandoverRows(catalog);
    setRows(initial);
    saveCurrentRows(initial);
  };

  const handleBulkUpdateOpeningStock = (stockMap: { [code: string]: number }) => {
    const rowByCode = new Map<string, PremixHandoverRow>();
    const rowByName = new Map<string, PremixHandoverRow>();
    rows.forEach((r) => {
      if (r.code) rowByCode.set(r.code.trim().toLowerCase(), r);
      if (r.name) rowByName.set(r.name.trim().toLowerCase(), r);
    });

    const updated = catalog.map((item) => {
      const itemCodeKey = (item.code || '').trim().toLowerCase();
      const itemNameKey = (item.name || '').trim().toLowerCase();
      const existing = (itemCodeKey && rowByCode.get(itemCodeKey)) || rowByName.get(itemNameKey);

      const newOpening =
        stockMap[item.code] !== undefined
          ? stockMap[item.code]
          : stockMap[item.name] !== undefined
          ? stockMap[item.name]
          : existing
          ? existing.openingStock
          : item.defaultOpeningStock || 0;

      if (existing) {
        return recalculateRow(
          { ...existing, openingStock: newOpening, pageNumber: item.pageNumber },
          0.5,
          autoReceipt,
          catalog
        );
      }

      return recalculateRow(
        {
          id: `row-${item.id}`,
          code: item.code,
          name: item.name,
          openingStock: newOpening,
          receivedQty: 0,
          theoryExpression: '',
          theoryTotal: 0,
          actualExpression: '',
          actualTotal: 0,
          closingStock: newOpening,
          lotNumber: item.defaultLotNumber || '',
          diff: 0,
          diffPercent: 0,
          isWithinTolerance: true,
          needsWarehouseReceipt: false,
          suggestedReceiptQty: 0,
          pageNumber: item.pageNumber,
          notes: '',
        },
        0.5,
        autoReceipt,
        catalog
      );
    });

    setRows(updated);
    saveCurrentRows(updated);
  };

  // Đồng bộ nạp Tồn đầu từ Google Sheet (Tự động chạy ngầm khi mở app hoặc bấm thủ công)
  const syncStocksFromSheet = async (
    isManual: boolean = false,
    targetCatalog?: PremixItem[],
    targetRows?: PremixHandoverRow[],
    targetSettings?: AppSettings
  ) => {
    const activeCatalog = targetCatalog || catalog;
    const activeRows = targetRows || rows;
    const activeSettings = targetSettings || settings;

    setIsFetchingSheet(true);
    setSheetSyncInfo((prev) => ({
      ...prev,
      status: 'loading',
      message: 'Đang kết nối Google Sheet...',
    }));

    try {
      const res = await fetchLatestStocksFromGoogleSheet(activeSettings.googleSheetUrl);
      if (res.success && res.stocks && res.stocks.length > 0) {
        const stockMap: { [code: string]: { stock: number; lot: string; shift: string; date: string } } = {};
        res.stocks.forEach((s) => {
          if (s.code) {
            stockMap[String(s.code).trim().toLowerCase()] = {
              stock: s.closingStock,
              lot: s.lotNumber,
              shift: s.lastShift,
              date: s.lastDate,
            };
          }
          if (s.name) {
            stockMap[String(s.name).trim().toLowerCase()] = {
              stock: s.closingStock,
              lot: s.lotNumber,
              shift: s.lastShift,
              date: s.lastDate,
            };
          }
        });

        const updated = activeRows.map((r) => {
          const keyByCode = (r.code || '').trim().toLowerCase();
          const keyByName = (r.name || '').trim().toLowerCase();
          const matched = (keyByCode ? stockMap[keyByCode] : undefined) || (keyByName ? stockMap[keyByName] : undefined);

          if (matched) {
            return recalculateRow(
              {
                ...r,
                openingStock: matched.stock,
                lotNumber: matched.lot || r.lotNumber,
              },
              0.5,
              autoReceipt,
              activeCatalog
            );
          }
          return r;
        });

        setRows(updated);
        saveCurrentRows(updated);

        const sample = res.stocks[0];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        setSheetSyncInfo({
          status: 'success',
          lastShift: sample.lastShift || '',
          lastDate: sample.lastDate || '',
          itemCount: res.stocks.length,
          lastSyncTime: timeStr,
          message: `Đã đồng bộ Tồn đầu (${sample.lastShift} - ${sample.lastDate}) lúc ${timeStr}`,
        });

        if (isManual) {
          alert(
            `✓ Đã tải và nạp thành công Tồn đầu của ${res.stocks.length} nguyên liệu từ Google Sheet (Chốt từ ${sample.lastShift} ngày ${sample.lastDate})!`
          );
        }
      } else {
        setSheetSyncInfo({
          status: 'error',
          message: res.message || 'Chưa có dữ liệu tồn kho trên Google Sheet.',
        });
        if (isManual) {
          alert(res.message || 'Chưa có dữ liệu tồn kho trên Google Sheet hoặc chưa cấu hình URL trong Cài đặt.');
        }
      }
    } catch (e: any) {
      setSheetSyncInfo({
        status: 'error',
        message: `Lỗi kết nối: ${e.message}`,
      });
      if (isManual) {
        alert(`Lỗi đồng bộ Google Sheet: ${e.message}`);
      }
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleFetchGoogleSheetStocks = () => {
    syncStocksFromSheet(true);
  };

  // Nộp báo cáo và bàn giao sang ca tiếp theo
  const handleConfirmHandover = (nextShiftInfo: ShiftInfo, nextRows: PremixHandoverRow[]) => {
    const reportSnapshot: HandoverReport = {
      ...currentReport,
      rows: [...rows],
      updatedAt: new Date().toISOString(),
    };
    saveReportToHistory(reportSnapshot);
    setHistory(getStoredHistory());

    setShiftInfo(nextShiftInfo);
    setRows(nextRows);
    saveShiftInfo(nextShiftInfo);
    saveCurrentRows(nextRows);

    setHandoverSuccessBanner({
      prevShiftNumber: reportSnapshot.shiftInfo.shiftNumber,
      prevDate: reportSnapshot.shiftInfo.date,
      newShiftNumber: nextShiftInfo.shiftNumber,
      newDate: nextShiftInfo.date,
      totalClosingStock: reportSnapshot.totalClosingStockKg,
      prevReport: reportSnapshot,
    });

    setActiveTab('scanner');
  };

  // Gộp số liệu từ 2 Tháp Cân (Cân Tôm & Cân Cá) và tự động tính SL nhận kho
  const handleUpdateFromDualScales = (
    shrimpRecords?: any[],
    fishRecords?: any[],
    shiftInfoDetected?: any
  ) => {
    let currentRowsCopy = [...rows];

    if (shiftInfoDetected) {
      const newShift = { ...shiftInfo };
      if (shiftInfoDetected.date) newShift.date = shiftInfoDetected.date;
      if (shiftInfoDetected.timeRange) newShift.timeRange = shiftInfoDetected.timeRange;
      if (shiftInfoDetected.shiftNumber) newShift.shiftNumber = shiftInfoDetected.shiftNumber;
      if (shiftInfoDetected.operatorName) newShift.operatorName = shiftInfoDetected.operatorName;
      setShiftInfo(newShift);
      saveShiftInfo(newShift);
    }

    const mergedMap: {
      [key: string]: {
        shrimpTheory?: number;
        shrimpActual?: number;
        fishTheory?: number;
        fishActual?: number;
        rawName: string;
      };
    } = {};

    if (shrimpRecords) {
      shrimpRecords.forEach((item) => {
        const matched = matchPremixFromCatalog(item.premixName || item.code || '', catalog);
        const key = matched?.code || item.code || item.premixName;
        if (!mergedMap[key]) {
          mergedMap[key] = { rawName: matched?.name || item.premixName };
        }
        mergedMap[key].shrimpTheory = item.theoryWeight || 0;
        mergedMap[key].shrimpActual = item.actualWeight || 0;
      });
    }

    if (fishRecords) {
      fishRecords.forEach((item) => {
        const matched = matchPremixFromCatalog(item.premixName || item.code || '', catalog);
        const key = matched?.code || item.code || item.premixName;
        if (!mergedMap[key]) {
          mergedMap[key] = { rawName: matched?.name || item.premixName };
        }
        mergedMap[key].fishTheory = item.theoryWeight || 0;
        mergedMap[key].fishActual = item.actualWeight || 0;
      });
    }

    for (const key in mergedMap) {
      const data = mergedMap[key];
      const matched = matchPremixFromCatalog(key, catalog);
      const codeToFind = matched?.code || key;
      const nameToFind = matched?.name || data.rawName;

      const existingIndex = currentRowsCopy.findIndex(
        (r) => (codeToFind && r.code === codeToFind) || (nameToFind && r.name.toLowerCase() === nameToFind.toLowerCase())
      );

      const theoryFormatted = formatTowerExpression(data.shrimpTheory, data.fishTheory);
      const actualFormatted = formatTowerExpression(data.shrimpActual, data.fishActual);

      if (existingIndex >= 0) {
        const row = currentRowsCopy[existingIndex];
        const updatedRow = recalculateRow(
          {
            ...row,
            shrimpTheory: data.shrimpTheory,
            shrimpActual: data.shrimpActual,
            fishTheory: data.fishTheory,
            fishActual: data.fishActual,
            theoryExpression: theoryFormatted.expression || row.theoryExpression,
            actualExpression: actualFormatted.expression || row.actualExpression,
          },
          0.5,
          autoReceipt,
          catalog
        );
        currentRowsCopy[existingIndex] = updatedRow;
      } else {
        const newRow = recalculateRow(
          {
            id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            code: codeToFind,
            name: nameToFind,
            openingStock: matched?.defaultOpeningStock || 0,
            receivedQty: 0,
            shrimpTheory: data.shrimpTheory,
            shrimpActual: data.shrimpActual,
            fishTheory: data.fishTheory,
            fishActual: data.fishActual,
            theoryExpression: theoryFormatted.expression,
            theoryTotal: theoryFormatted.total,
            actualExpression: actualFormatted.expression,
            actualTotal: actualFormatted.total,
            closingStock: 0,
            lotNumber: matched?.defaultLotNumber || '',
            diff: 0,
            diffPercent: 0,
            isWithinTolerance: true,
            pageNumber: matched?.pageNumber || 1,
          },
          0.5,
          autoReceipt,
          catalog
        );
        currentRowsCopy.push(newRow);
      }
    }

    setRows(currentRowsCopy);
    saveCurrentRows(currentRowsCopy);
  };

  const handleLoadExampleFromPhoto = () => {
    setShiftInfo({
      date: '26/08/2026',
      timeRange: '07h30 -> 15h30',
      shiftNumber: '1',
      operatorName: 'N. Tường',
      sectionCode: '03F26',
      revision: '01',
      formDate: '23/12/2025',
      companyName: 'De Heus',
      notes: 'Bàn giao ca 1',
    });
    saveShiftInfo({
      date: '26/08/2026',
      timeRange: '07h30 -> 15h30',
      shiftNumber: '1',
      operatorName: 'N. Tường',
      sectionCode: '03F26',
      revision: '01',
      formDate: '23/12/2025',
      companyName: 'De Heus',
      notes: 'Bàn giao ca 1',
    });

    const initialRows = createInitialHandoverRows(catalog);
    const updated = initialRows.map(r => {
      if (r.code === '1404060') {
        return recalculateRow({
          ...r,
          openingStock: 2.99,
          receivedQty: 40,
          shrimpTheory: 8,
          fishTheory: 16,
          shrimpActual: 8.01,
          fishActual: 15.99,
          theoryExpression: '8 + 16',
          actualExpression: '8.01 + 15.99',
          lotNumber: '030526 PO 82975 PO 260202',
        }, 0.5, true, catalog);
      }
      if (r.code === '2303010') {
        return recalculateRow({
          ...r,
          openingStock: 19.86,
          receivedQty: 150,
          theoryExpression: '126.4',
          actualExpression: '126.39',
          lotNumber: '030826 PO 83770 RM02',
        }, 0.5, true, catalog);
      }
      if (r.code === '2404010') {
        return recalculateRow({
          ...r,
          openingStock: 763.2,
          theoryExpression: '22 + 16',
          actualExpression: '22.02 + 15.98',
          lotNumber: '120826 PO 1400 SR26F00213',
        }, 0.5, true, catalog);
      }
      if (r.code === '3015020') {
        return recalculateRow({
          ...r,
          openingStock: 8.39,
          receivedQty: 100,
          theoryExpression: '84 + 12.32',
          actualExpression: '83.96 + 12.3',
          lotNumber: '230626 PO 1019611260110',
        }, 0.5, true, catalog);
      }
      if (r.code === '3016010') {
        return recalculateRow({
          ...r,
          openingStock: 17.16,
          receivedQty: 25,
          theoryExpression: '16 + 25.6',
          actualExpression: '16.02 + 25.58',
          lotNumber: '030826 PO 83770 PO 112026041707',
        }, 0.5, true, catalog);
      }
      return r;
    });

    setRows(updated);
    saveCurrentRows(updated);
  };

  const handleSaveToHistory = (report: HandoverReport) => {
    saveReportToHistory(report);
    setHistory(getStoredHistory());
  };

  const handleLoadReportFromHistory = (report: HandoverReport) => {
    setShiftInfo(report.shiftInfo);
    setRows(report.rows);
    saveShiftInfo(report.shiftInfo);
    saveCurrentRows(report.rows);
    setActiveTab('report');
  };

  const handleDeleteHistory = (id: string) => {
    deleteReportFromHistory(id);
    setHistory(getStoredHistory());
  };

  const handleUpdateOperatorsList = (newList: string[]) => {
    setOperatorsList(newList);
    saveStoredOperatorsList(newList);
    const updated = { ...settings, operatorsList: newList };
    setSettings(updated);
    saveSettings(updated);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider">ĐANG TẢI ỨNG DỤNG BÀN GIAO PREMIX DE HEUS...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        shiftInfo={shiftInfo}
        onShiftInfoChange={handleShiftInfoChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHandover={() => setIsHandoverOpen(true)}
        settings={settings}
        totalActualUsedKg={totals.totalActualUsedKg}
        totalTheoryUsedKg={totals.totalTheoryUsedKg}
        totalClosingStockKg={totals.totalClosingStockKg}
        activeRowCount={totals.activeRowCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminAuthOpen(true)}
        onLockAdmin={() => {
          setIsAdmin(false);
          saveStoredIsAdmin(false);
          if (activeTab === 'catalog') setActiveTab('scanner');
        }}
        operatorsList={operatorsList}
        onOpenOperatorManage={() => setIsOperatorManageOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner thông báo Bàn Giao Ca Thành Công */}
        {handoverSuccessBanner && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white shadow-xl border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-500/30 text-emerald-300 text-xs font-black px-2 py-0.5 rounded border border-emerald-500/40">
                    BÀN GIAO THÀNH CÔNG
                  </span>
                  <h4 className="text-sm font-bold">
                    Ca {handoverSuccessBanner.prevShiftNumber} ({handoverSuccessBanner.prevDate}) $\rightarrow$ Ca {handoverSuccessBanner.newShiftNumber} ({handoverSuccessBanner.newDate})
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  ✓ Toàn bộ <strong>{handoverSuccessBanner.totalClosingStock.toFixed(2)} kg</strong> tồn cuối của Ca {handoverSuccessBanner.prevShiftNumber} đã được nối thành <strong>Tồn đầu cho Ca {handoverSuccessBanner.newShiftNumber}</strong>. Bảng số liệu đã được làm mới sạch sẽ để bắt đầu cân ca mới!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleLoadReportFromHistory(handoverSuccessBanner.prevReport);
                  setHandoverSuccessBanner(null);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xem lại / In Ca {handoverSuccessBanner.prevShiftNumber}</span>
              </button>
              <button
                type="button"
                onClick={() => setHandoverSuccessBanner(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Quét Ảnh 2 Cân & Nhập Phiếu */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <ImageScanner
              key={`${shiftInfo.date}-Ca${shiftInfo.shiftNumber}`}
              premixCatalog={catalog}
              currentRows={rows}
              customApiKey={settings.geminiApiKey}
              onUpdateFromDualScales={handleUpdateFromDualScales}
              onOpenSettings={() => (isAdmin ? setIsSettingsOpen(true) : setIsAdminAuthOpen(true))}
            />

            <DataTable
              rows={rows}
              premixCatalog={catalog}
              autoReceipt={autoReceipt}
              onToggleAutoReceipt={handleToggleAutoReceipt}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
              onAddRow={handleAddRow}
              onResetToDefaultList={handleResetToDefaultList}
              onLoadExampleFromPhoto={handleLoadExampleFromPhoto}
              onBulkUpdateOpeningStock={handleBulkUpdateOpeningStock}
              onRecalculateAllReceipts={handleRecalculateAllReceipts}
              onFetchGoogleSheetStocks={handleFetchGoogleSheetStocks}
              isFetchingSheet={isFetchingSheet}
              sheetSyncInfo={sheetSyncInfo}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsHandoverOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95"
              >
                <span>🔒 Nộp Báo Cáo & Bàn Giao Ca {shiftInfo.shiftNumber} Sang Ca {nextShiftPreview.nextShiftInfo.shiftNumber}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                Xem Mẫu Báo Cáo De Heus & Xuất Excel $\rightarrow$
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Mẫu Báo Cáo De Heus & Xuất Excel */}
        {activeTab === 'report' && (
          <SummaryReport
            report={currentReport}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {/* Tab 3: Danh Mục 43 Loại & Quy Cách Bao (Chỉ Admin mới truy cập được) */}
        {activeTab === 'catalog' && isAdmin && (
          <PremixCatalog
            catalog={catalog}
            onUpdateCatalog={handleUpdateCatalog}
          />
        )}

        {/* Tab 4: Lịch Sử Báo Cáo Ca */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onLoadReport={handleLoadReportFromHistory}
            onDeleteReport={handleDeleteHistory}
          />
        )}
      </div>

      <HandoverModal
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
        currentReport={currentReport}
        onConfirmHandover={handleConfirmHandover}
        onSaveHistoryOnly={handleSaveToHistory}
        nextShiftData={nextShiftPreview}
        googleSheetUrl={settings.googleSheetUrl}
        operatorsList={operatorsList}
      />

      {isAdmin && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        correctPin={settings.adminPin || '20000'}
        onSuccess={() => {
          setIsAdmin(true);
          saveStoredIsAdmin(true);
        }}
      />

      <OperatorManageModal
        isOpen={isOperatorManageOpen}
        onClose={() => setIsOperatorManageOpen(false)}
        operatorsList={operatorsList}
        currentOperator={shiftInfo.operatorName}
        onUpdateOperatorsList={handleUpdateOperatorsList}
        onSelectOperator={(name) => {
          handleShiftInfoChange({ ...shiftInfo, operatorName: name });
        }}
      />
    </main>
  );
}
