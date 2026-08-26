import { GoogleGenerativeAI } from '@google/generative-ai';
import { PremixItem } from '../types';
export { matchPremixFromCatalog } from './storage';

export interface ExtractedWeighingData {
  scaleType?: 'shrimp' | 'fish' | 'general';
  records: Array<{
    code?: string;
    premixName: string;
    actualWeight?: number;
    theoryWeight?: number;
    openingStock?: number;
    receivedQty?: number;
    lotNumber?: string;
    timestamp?: string;
    rawText?: string;
  }>;
  shiftInfoDetected?: {
    date?: string;
    timeRange?: string;
    shiftNumber?: string;
    operatorName?: string;
    totalBatches?: number;
  };
  notes?: string;
}

export function buildPromptForWeighingScale(premixCatalog: PremixItem[], scaleTarget?: 'shrimp' | 'fish'): string {
  const catalogList = premixCatalog.map(p => `- Code: "${p.code}", Tên: "${p.name}"`).join('\n');
  const targetLabel = scaleTarget === 'shrimp' ? 'CÂN THÁP CÁM TÔM' : scaleTarget === 'fish' ? 'CÂN THÁP CÁM CÁ' : 'MÀN HÌNH CÂN / BÁO CÁO MỨC SỬ DỤNG NGUYÊN LIỆU';

  return `
Bạn là chuyên gia AI bóc tách số liệu từ ảnh chụp màn hình máy tính SCADA cân tự động và phiếu "BÁO CÁO MỨC SỬ DỤNG NGUYÊN LIỆU" của nhà máy De Heus.
Mục tiêu phân tích: [${targetLabel}].

DANH MỤC NGUYÊN LIỆU DE HEUS CHUẨN:
${catalogList}

NHIỆM VỤ CỦA BẠN:
1. Đọc bảng số liệu trong ảnh gồm các cột: TÊN NGUYÊN LIỆU, KL LÝ THUYẾT, KL THỰC TẾ, SAI LỆCH (hoặc màn hình cân điện tử tương tự).
2. Trích xuất từng dòng nguyên liệu gồm:
   - "premixName": Tên nguyên liệu. Khớp chính xác với danh mục chuẩn ở trên (ví dụ "AQUALYSO STD", "Bột đầu cá cơm", "MYCELIUM (STIMMUNOGUARD)", "CHOLINE CHLORID 60", "BETAIN HCL 95%", "DL-METHIONINE 99%", "L-THREONINE", "Muối (Dry Salt)"...).
   - "theoryWeight": Khối lượng LÝ THUYẾT (dạng số thập phân, vd: 8, 360, 22, 308, 84, 16...).
   - "actualWeight": Khối lượng THỰC TẾ (dạng số thập phân, vd: 8.01, 360, 22.02, 307.97, 83.96, 16.02...).
   - "rawText": Dòng chữ/con số thô đọc được trên màn hình.

3. Đọc thông tin tiêu đề (nếu có):
   - "date": Ngày (vd: 26/08/2026)
   - "timeRange": Thời gian (vd: Từ 26/08/2026 06:00 đến 27/08/2026 07:00)
   - "totalBatches": Tổng số mẻ (vd: 19)

QUY TẮC BẮT BUỘC:
- Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau, KHÔNG có text giải thích ngoài JSON:
{
  "scaleType": "${scaleTarget || 'general'}",
  "records": [
    {
      "premixName": "AQUALYSO STD",
      "theoryWeight": 8,
      "actualWeight": 8.01,
      "rawText": "AQUALYSO STD: 8 - 8.01"
    },
    {
      "premixName": "MYCELIUM (STIMMUNOGUARD)",
      "theoryWeight": 22,
      "actualWeight": 22.02,
      "rawText": "MYCELIUM: 22 - 22.02"
    }
  ],
  "shiftInfoDetected": {
    "date": "26/08/2026",
    "timeRange": "06:00 -> 07:00",
    "totalBatches": 19
  }
}
`;
}

export async function analyzeWeighingImage(
  imageBase64: string,
  premixCatalog: PremixItem[],
  customApiKey?: string,
  scaleTarget?: 'shrimp' | 'fish'
): Promise<ExtractedWeighingData> {
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

  // 1. Thử gọi qua API route Serverless Next.js trước
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: cleanBase64,
        mimeType,
        premixCatalog,
        apiKey: customApiKey || undefined,
        scaleTarget,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    const errData = await response.json().catch(() => null);
    if (errData?.error && !customApiKey) {
      throw new Error(errData.error);
    }
  } catch (serverError: any) {
    if (!customApiKey) throw serverError;
  }

  // 2. Fallback gọi trực tiếp từ Client nếu có Custom API Key
  if (customApiKey) {
    const genAI = new GoogleGenerativeAI(customApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = buildPromptForWeighingScale(premixCatalog, scaleTarget);

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cleanBase64, mimeType } },
    ]);

    return parseGeminiJsonResponse(result.response.text());
  }

  throw new Error('Chưa cấu hình API Key. Vui lòng vào Cài đặt để nhập Gemini API Key miễn phí.');
}

export function parseGeminiJsonResponse(text: string): ExtractedWeighingData {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
    else if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
    cleanText = cleanText.trim();

    return JSON.parse(cleanText) as ExtractedWeighingData;
  } catch (err) {
    console.error('Lỗi JSON từ AI:', text, err);
    throw new Error('AI không trả về đúng định dạng số liệu. Vui lòng chụp lại ảnh rõ nét hơn.');
  }
}
