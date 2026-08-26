import * as XLSX from 'xlsx';
import { HandoverReport, PremixItem } from '../types';

/**
 * Xuất file Excel chuẩn 100% theo mẫu "Bàn giao premix - phụ gia" của De Heus
 */
export function exportHandoverReportToExcel(report: HandoverReport): void {
  const wb = XLSX.utils.book_new();

  // Tạo tiêu đề đầu trang
  const headerData = [
    ['de heus', '', '', 'Bàn giao premix - phụ gia', '', '', 'Section : ' + (report.shiftInfo.sectionCode || '03F26')],
    ['', '', '', '', '', '', 'Revision : ' + (report.shiftInfo.revision || '01')],
    ['', '', '', '', '', '', 'Date : ' + (report.shiftInfo.formDate || '23/12/2025')],
    ['', '', '', '', '', '', 'GMP - Q'],
    [
      `Ngày: ${report.shiftInfo.date}`,
      '',
      report.shiftInfo.timeRange || '07h30 -> 15h30',
      `Ca sx: ${report.shiftInfo.shiftNumber}`,
      '',
      '',
      `Nhân viên cân: ${report.shiftInfo.operatorName}`
    ],
    [],
    [
      'Code',
      'Tên nguyên liệu',
      'Tồn đầu\nKG',
      'SL nhận\n(KG)',
      'Số lượng\nSử dụng (KG)\nLÝ THUYẾT',
      'Số lượng\nSử dụng (KG)\nTHỰC TẾ',
      'Tồn cuối\nKG',
      'Số lô'
    ]
  ];

  // Dữ liệu từng dòng nguyên liệu
  const rowsData = report.rows.map((row) => [
    row.code,
    row.name,
    row.openingStock || 0,
    row.receivedQty > 0 ? row.receivedQty : '',
    row.theoryExpression || (row.theoryTotal > 0 ? row.theoryTotal : ''),
    row.actualExpression || (row.actualTotal > 0 ? row.actualTotal : ''),
    row.closingStock,
    row.lotNumber || ''
  ]);

  // Hàng Tổng cộng
  const totalRow = [
    'TỔNG CỘNG (KG)',
    '',
    report.totalOpeningStockKg,
    report.totalReceivedKg,
    report.totalTheoryUsedKg,
    report.totalActualUsedKg,
    report.totalClosingStockKg,
    ''
  ];

  // Khung chữ ký chân trang
  const footerData = [
    [],
    ['', 'Nhân viên cân', '', 'Tổ trưởng sản xuất', '', '', 'Giám sát phân xưởng'],
    [],
    [],
    ['', report.shiftInfo.operatorName, '', '...........................', '', '', '...........................']
  ];

  const fullSheetData = [...headerData, ...rowsData, totalRow, ...footerData];
  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Cấu hình độ rộng các cột
  ws['!cols'] = [
    { wch: 12 }, // Code
    { wch: 36 }, // Tên nguyên liệu
    { wch: 12 }, // Tồn đầu
    { wch: 12 }, // SL nhận
    { wch: 18 }, // Lý thuyết
    { wch: 22 }, // Thực tế
    { wch: 12 }, // Tồn cuối
    { wch: 38 }  // Số lô
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'BanGiao_Premix');

  const safeDate = (report.shiftInfo.date || 'today').replace(/[\/\-]/g, '');
  const safeShift = (report.shiftInfo.shiftNumber || '1').replace(/\s+/g, '_');
  const fileName = `DeHeus_BanGiao_Premix_${safeDate}_Ca${safeShift}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Xuất danh mục nguyên liệu De Heus ra Excel
 */
export function exportCatalogToExcel(catalog: PremixItem[]): void {
  const wb = XLSX.utils.book_new();
  const headers = [
    ['DANH MỤC NGUYÊN LIỆU PREMIX - DE HEUS'],
    [],
    ['STT', 'Code', 'Tên Nguyên Liệu', 'Nhóm', 'Định Mức Chuẩn (kg)', 'Tồn Đầu Mặc Định', 'Số Lô Mặc Định', 'Ghi Chú']
  ];

  const rows = catalog.map((item, idx) => [
    idx + 1,
    item.code,
    item.name,
    item.category || '—',
    item.defaultWeight,
    item.defaultOpeningStock || 0,
    item.defaultLotNumber || '',
    item.description || ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 36 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DanhMucDeHeus');
  XLSX.writeFile(wb, 'DanhMuc_DeHeus_Premix.xlsx');
}
