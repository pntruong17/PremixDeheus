import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildPromptForWeighingScale, parseGeminiJsonResponse } from '@/lib/gemini';
import { PremixItem } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', premixCatalog = [], apiKey, scaleTarget } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp dữ liệu ảnh base64.' },
        { status: 400 }
      );
    }

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(
        {
          error: 'Chưa có Gemini API Key. Vui lòng cấu hình biến GEMINI_API_KEY trên Vercel hoặc nhập API Key trong phần Cài đặt.',
          needsApiKey: true,
        },
        { status: 401 }
      );
    }

    const genAI = new GoogleGenerativeAI(effectiveApiKey);
    
    // Sử dụng model mới nhất gemini-3.6-flash hoặc gemini-flash-latest
    let model;
    try {
      model = genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
        },
      });
    } catch (mErr) {
      model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
        },
      });
    }

    const prompt = buildPromptForWeighingScale(premixCatalog as PremixItem[], scaleTarget);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    const parsedData = parseGeminiJsonResponse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing image with Gemini:', error);
    return NextResponse.json(
      {
        error: error.message || 'Đã xảy ra lỗi khi phân tích ảnh bằng AI. Vui lòng thử lại.',
      },
      { status: 500 }
    );
  }
}
