# MAEL Frontend - Multi-Agent Edtech Learning

Giao diện web học Toán THCS cùng 3 AI, dựng theo design trên Google Stitch.
**React 18 + Vite 5 + Tailwind CSS 3 + React Router 6 + Axios.**

## Chạy
Cần Node.js 18+ và BE đang chạy ở http://localhost:8089.

```bash
npm install
npm run dev
```
Copy `.env.example` thành `.env` (địa chỉ BE: `VITE_BE_URL`, mặc định `http://localhost:8089`). Mở http://localhost:5173. Vite proxy `/api` và `/uploads` sang BE nên không cần cấu hình CORS khi dev.

Tài khoản demo (mật khẩu `123456`): `hocsinh@mael.vn` (học sinh), `giangvien@mael.vn` (giảng viên).

Build: `npm run build` (ra thư mục `dist/`). Khi FE và BE deploy khác domain, tạo file `.env` với `VITE_API_URL=https://địa-chỉ-be`.

## Các trang
| Đường dẫn | Trang |
|---|---|
| `/login` | Đăng nhập / Đăng ký (chọn khối lớp, tặng 7 ngày dùng thử) |
| `/` | Trang chủ & Lộ trình (bài dở dang, chủ đề theo lớp 6-9, điểm yếu, kết quả) |
| `/lessons/:id` | Bài giảng |
| `/study-room` | Chọn bài để thảo luận, lịch sử phiên |
| `/study-room/:sessionId` | Phòng thảo luận: Thầy Minh Trí, Tuấn Kiệt, Bảo An + học sinh |
| `/photo-solver` | Giải toán bằng ảnh (kéo thả / chụp camera) |
| `/quizzes`, `/quizzes/:id` | Luyện tập, quiz củng cố điểm yếu |
| `/pricing` | Gói học & dùng thử 99.000đ/tháng |
| `/checkout/:paymentId` | Thanh toán MoMo (đang ở chế độ giả lập) |
| `/notifications`, `/achievements` | Thông báo, huy hiệu |
| `/lecturer` | Cổng giảng viên: duyệt bài giảng, câu hỏi, xử lý báo lỗi |

## Cấu trúc
```
src
├── api           client.js (axios + JWT), services.js (tất cả API)
├── context       AuthContext (đăng nhập, user hiện tại)
├── components    layout (Header, Footer, AppLayout, ProtectedRoute), common (Icon, Loading, ReportButton...)
├── constants     agents.js (ảnh + màu từng AI)
├── pages         các trang
├── assets        logo, ảnh nhân vật lấy từ design
└── utils         format tiền, ngày giờ
```
Màu, font (Plus Jakarta Sans), khoảng cách lấy từ design system của Stitch, khai báo trong `tailwind.config.js`. Icon dùng Material Symbols.

## Phần chờ tích hợp
- **MoMo**: khi BE trả `payUrl` / `qrCodeUrl`, trang checkout tự hiện QR và nút mở ví; khối "Chế độ thử nghiệm" sẽ tự ẩn.
- **AI**: không cần sửa FE, chỉ đổi phần BE.
