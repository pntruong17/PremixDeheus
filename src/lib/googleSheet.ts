import { HandoverReport, PremixHandoverRow, ShiftInfo } from '../types';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT CHO HỆ THỐNG BÀN GIAO PREMIX DE HEUS
 * Tự động ghi nhận báo cáo ca và đồng bộ tồn kho giữa các điện thoại
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'SAVE_REPORT';

    if (action === 'SAVE_REPORT') {
      var report = payload.report;
      
      // 1. Ghi vào Sheet "LICH_SU_CA"
      var historySheet = ss.getSheetByName('LICH_SU_CA');
      if (!historySheet) {
        historySheet = ss.insertSheet('LICH_SU_CA');
        historySheet.appendRow([
          'Thời Gian Nộp', 'Ngày', 'Khung Giờ', 'Ca', 'Người Cân',
          'Số Loại Dùng', 'Tổng Lý Thuyết (kg)', 'Tổng Thực Tế (kg)', 'Tổng Nhận Kho (kg)', 'Tổng Tồn Cuối (kg)', 'Ghi Chú'
        ]);
        historySheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
      }

      historySheet.appendRow([
        new Date().toLocaleString('vi-VN'),
        report.shiftInfo.date,
        report.shiftInfo.timeRange,
        'Ca ' + report.shiftInfo.shiftNumber,
        report.shiftInfo.operatorName,
        report.activeRowCount || 0,
        report.totalTheoryUsedKg || 0,
        report.totalActualUsedKg || 0,
        report.totalReceivedKg || 0,
        report.totalClosingStockKg || 0,
        report.shiftInfo.notes || ''
      ]);

      // 2. Ghi chi tiết từng nguyên liệu vào Sheet "CHI_TIET_CA"
      var detailSheet = ss.getSheetByName('CHI_TIET_CA');
      if (!detailSheet) {
        detailSheet = ss.insertSheet('CHI_TIET_CA');
        detailSheet.appendRow([
          'Thời Gian', 'Ngày', 'Ca', 'Trang', 'Code', 'Tên Nguyên Liệu',
          'Tồn Đầu (kg)', 'SL Nhận (kg)', 'Lý Thuyết (kg)', 'Thực Tế (kg)',
          'Tồn Cuối (kg)', 'Số Lô', 'Người Cân'
        ]);
        detailSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      }

      report.rows.forEach(function(row) {
        if (row.actualTotal > 0 || row.theoryTotal > 0 || row.receivedQty > 0 || row.openingStock > 0) {
          detailSheet.appendRow([
            new Date().toLocaleString('vi-VN'),
            report.shiftInfo.date,
            'Ca ' + report.shiftInfo.shiftNumber,
            'Trang ' + (row.pageNumber || 1),
            row.code,
            row.name,
            row.openingStock,
            row.receivedQty,
            row.theoryExpression || row.theoryTotal,
            row.actualExpression || row.actualTotal,
            row.closingStock,
            row.lotNumber,
            report.shiftInfo.operatorName
          ]);
        }
      });

      // 3. Cập nhật Sheet "TON_KHO_HIEN_TAI" (Để ca tiếp theo lấy làm Tồn đầu)
      var stockSheet = ss.getSheetByName('TON_KHO_HIEN_TAI');
      if (!stockSheet) {
        stockSheet = ss.insertSheet('TON_KHO_HIEN_TAI');
      }
      stockSheet.clear();
      stockSheet.appendRow(['Mã Code', 'Tên Nguyên Liệu', 'Trang', 'Tồn Cuối Ca Vừa Qua (KG)', 'Số Lô', 'Ca Vừa Chốt', 'Ngày Chốt']);
      stockSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');

      report.rows.forEach(function(row) {
        stockSheet.appendRow([
          row.code,
          row.name,
          row.pageNumber || 1,
          row.closingStock,
          row.lotNumber,
          'Ca ' + report.shiftInfo.shiftNumber,
          report.shiftInfo.date
        ]);
      });

      return ContentService.createTextOutput(JSON.stringify({
        status: 'SUCCESS',
        message: 'Đã lưu thành công vào Google Sheet!',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: 'Hành động không hợp lệ' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stockSheet = ss.getSheetByName('TON_KHO_HIEN_TAI');
    
    if (!stockSheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'EMPTY',
        stocks: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = stockSheet.getDataRange().getValues();
    var stocks = [];
    
    for (var i = 1; i < data.length; i++) {
      stocks.push({
        code: String(data[i][0]),
        name: String(data[i][1]),
        pageNumber: Number(data[i][2]) || 1,
        closingStock: Number(data[i][3]) || 0,
        lotNumber: String(data[i][4] || ''),
        lastShift: String(data[i][5] || ''),
        lastDate: String(data[i][6] || '')
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'SUCCESS',
      stocks: stocks,
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Gửi báo cáo ca lên Google Sheet (Tự động fallback URL mặc định nếu để trống)
 */
export async function syncReportToGoogleSheet(
  report: HandoverReport,
  webAppUrl?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: webAppUrl || undefined,
        action: 'SAVE_REPORT',
        report,
      }),
    });

    const result = await response.json();
    if (result.status === 'SUCCESS' || result.success) {
      return { success: true, message: 'Đã đồng bộ thành công lên Google Sheet!' };
    }
    return { success: false, message: result.message || 'Lỗi khi đồng bộ Google Sheet' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Không thể kết nối đến Google Sheet' };
  }
}

/**
 * Lấy Tồn kho mới nhất từ Google Sheet (Tự động fallback URL mặc định nếu để trống)
 */
export async function fetchLatestStocksFromGoogleSheet(
  webAppUrl?: string
): Promise<{ success: boolean; stocks?: any[]; message?: string }> {
  try {
    const urlParam = webAppUrl ? `?webAppUrl=${encodeURIComponent(webAppUrl)}` : '';
    const response = await fetch(`/api/sheet${urlParam}`, {
      method: 'GET',
    });
    const result = await response.json();
    if (result.status === 'SUCCESS' && Array.isArray(result.stocks)) {
      return { success: true, stocks: result.stocks };
    }
    return { success: false, message: result.message || 'Không lấy được dữ liệu tồn kho' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Lỗi tải dữ liệu Google Sheet' };
  }
}
