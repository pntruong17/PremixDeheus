# Premix AI Reporter ⚖️✨

> **Trợ lý Báo Cáo Cân Premix Thông Minh Bằng AI Miễn Phí (Google Gemini Vision)**  
> Ứng dụng Next.js hiện đại giúp tự động dịch ảnh chụp màn hình máy cân điện tử sang bảng số liệu, tự động tính toán tổng ca, kiểm soát sai số theo danh mục hơn 20 loại premix, xuất file Excel (`.xlsx`) và in phiếu báo cáo ca chuẩn A4.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/premix-ai-reporter)

---

## 🌟 Điểm Nổi Bật

1. **AI Thị Giác Hoàn Toàn Miễn Phí (Google Gemini 2.5/1.5 Flash):**
   - Đọc chính xác màn hình cân điện tử (LED 7 đoạn, LCD cân bàn, máy tính SCADA/HMI, phiếu in nhiệt, bảng ghi chép).
   - Tốc độ bóc tách chỉ từ 1 - 2 giây.
   - Miễn phí 100% qua Google AI Studio.
2. **Tối Ưu Chi Phí 100% (Vercel & PWA):**
   - Triển khai miễn phí trọn đời trên Vercel (Hobby plan).
   - Hỗ trợ PWA: Cài đặt trực tiếp lên màn hình chính của điện thoại (iPhone / Android) như một app thông thường, mở camera chụp ngay tại xưởng.
3. **Quản Lý Hơn 20 Loại Premix Chuẩn:**
   - Tích hợp sẵn 25 loại premix phổ biến (Vitamin, Khoáng vi lượng, Khoáng đa lượng, Choline, Acid hữu cơ, Heo, Gà, Tôm, Bò sữa...).
   - AI tự động khớp (Fuzzy matching) tên nhận diện từ ảnh vào mã danh mục chuẩn của nhà máy.
4. **Bộ Tính Toán Tự Động Theo Ca:**
   - Tự động cộng tổng khối lượng theo từng loại premix.
   - Tổng sản lượng ca, tỷ lệ đạt chuẩn, cảnh báo mẻ bị lệch dung sai bằng màu sắc trực quan.
5. **Xuất Báo Cáo Đa Định Dạng:**
   - Xuất file Excel (`.xlsx`) với đầy đủ bảng tổng hợp, bảng chi tiết từng mẻ, công thức Excel.
   - In ấn phiếu A4 có đầy đủ chữ ký người cân, tổ trưởng, quản lý.

---

## 🚀 Hướng Dẫn Triển Khai Lên Vercel (2 Phút)

### Bước 1: Lấy Google Gemini API Key Miễn Phí
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Đăng nhập bằng tài khoản Google bất kỳ.
3. Bấm **Create API Key** và sao chép mã Key (dạng `AIzaSy...`).

### Bước 2: Đẩy Mã Nguồn Lên GitHub
```bash
git init
git add .
git commit -m "Initial commit Premix AI Reporter"
# Tạo repository trên github.com và push lên:
git remote add origin https://github.com/<tai-khoan-cua-ban>/premix-ai-reporter.git
git branch -M main
git push -u origin main
```

### Bước 3: Deploy Lên Vercel
1. Đăng nhập [vercel.com](https://vercel.com) bằng tài khoản GitHub.
2. Bấm **Add New...** $\rightarrow$ **Project** $\rightarrow$ Chọn repository `premix-ai-reporter` (hoặc `PremixDeheus`).
3. Tại phần **Environment Variables**, cấu hình các biến sau:
   - **`GEMINI_API_KEY`** *(Bắt buộc)*: Dán API Key lấy từ Google AI Studio (bước 1).
   - **`GOOGLE_SHEET_WEBHOOK_URL`** *(Tùy chọn)*: Dán URL Webhook Apps Script nếu muốn toàn bộ hệ thống đồng bộ về 1 file Google Sheet chung.
4. Bấm **Deploy**!
5. Sau 1 phút, bạn sẽ nhận được đường link website miễn phí dạng `https://premix-ai-reporter.vercel.app`.

---

## 💻 Chạy Ứng Dụng Trên Máy Tính Cục Bộ (Local)

1. Cài đặt dependencies:
   ```bash
   npm install
   ```
2. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## 📱 Cài Đặt Lên Điện Thoại (PWA)

- **Trên iPhone (Safari):** Mở link Vercel $\rightarrow$ Bấm nút **Chia sẻ (Share)** $\rightarrow$ Chọn **Thêm vào MH chính (Add to Home Screen)**.
- **Trên Android (Chrome):** Mở link Vercel $\rightarrow$ Bấm biểu tượng 3 chấm góc phải $\rightarrow$ Chọn **Cài đặt ứng dụng / Thêm vào màn hình chính**.

---

## 🛠️ Công Nghệ Sử Dụng

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS (Industrial Dashboard Theme)
- **AI Vision:** Google Generative AI SDK (`gemini-1.5-flash` / `gemini-2.5-flash`)
- **Excel Engine:** SheetJS (`xlsx`)
- **Icons:** Lucide React
- **Storage:** LocalStorage & IndexedDB (Lưu trữ cục bộ bảo mật, không lộ dữ liệu sản xuất ra ngoài)
