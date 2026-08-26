import { NextRequest, NextResponse } from 'next/server';

// URL Google Sheet mặc định của hệ thống (nếu có cấu hình trong file .env hoặc biến môi trường Vercel)
const DEFAULT_SHEET_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webAppUrl, action, report } = body;

    const targetUrl = webAppUrl || DEFAULT_SHEET_URL;
    if (!targetUrl) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Chưa cấu hình URL Google Sheet Webhook trên máy chủ hoặc trong cài đặt.' },
        { status: 400 }
      );
    }

    const googleRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action || 'SAVE_REPORT', report }),
      redirect: 'follow',
    });

    const data = await googleRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error.message || 'Lỗi kết nối Google Sheet' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('webAppUrl') || DEFAULT_SHEET_URL;

    if (!targetUrl) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Chưa cấu hình URL Google Sheet.' },
        { status: 400 }
      );
    }

    const googleRes = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    const data = await googleRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error.message || 'Lỗi tải dữ liệu từ Google Sheet' },
      { status: 500 }
    );
  }
}
