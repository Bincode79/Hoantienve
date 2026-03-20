<div align="center">
<img width="1200" height="475" alt="AeroRefund Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hệ Thống Hoàn Tiền Tự Động

Hệ thống hoàn tiền vé máy bay, minh bạch, bảo mật, an toàn và dễ sử dụng.

## Tính năng

### Với khách hàng
- **Tạo yêu cầu hoàn vé**: Điền thông tin đơn hàng, thông tin ngân hàng để yêu cầu hoàn tiền
- **Theo dõi trạng thái**: Xem chi tiết trạng thái xử lý yêu cầu theo thời gian thực
- **Chat với admin**: Giao tiếp trực tiếp với đội ngũ hỗ trợ
- **Xuất báo cáo**: Tải danh sách yêu cầu dưới dạng file CSV

### Với Quản trị viên
- **Quản lý người dùng**: Xem, khóa/mở khóa tài khoản, phân quyền
- **Xử lý yêu cầu hoàn tiền**: Duyệt, từ chối, xử lý hoàn tiền với nhiều trạng thái
- **Nhật ký hoạt động**: Theo dõi mọi thay đổi của admin
- **Quản lý mã đặt chỗ**: Theo dõi và cập nhật thông tin booking
- **Thông báo FCM**: Gửi thông báo đẩy qua Firebase Cloud Messaging

## Công nghệ sử dụng

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Lucide Icons
- **Animation**: Motion (Framer Motion)
- **Backend**: Express.js, Firebase Admin
- **Database**: Firebase Firestore (thời gian thực)
- **Authentication**: Firebase Authentication

## Cài đặt

### Yêu cầu
- Node.js 18+
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository và cài đặt dependencies:**
```bash
npm install
```

2. **Tạo file `.env.local` với các biến môi trường cần thiết:**
```bash
cp .env.example .env.local
```

3. **Cấu hình các biến trong `.env.local`:**
```env
# Firebase Client (VITE_* prefix để truy cập từ client-side)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Cloud Messaging (VAPID Key)
VITE_FCM_VAPID_KEY=your_vapid_key

# Gemini AI API (Server-side only)
GEMINI_API_KEY=your_gemini_api_key

# Firebase Admin (Server-side only - JSON string của service account)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

4. **Chạy ứng dụng:**
```bash
# Chế độ phát triển
npm run dev

# Build production
npm run build

# Chạy server production
npm start
```

## Cấu trúc dự án

```
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # React entry point
│   ├── index.css        # Global styles và Tailwind
│   └── mockFirebase.ts  # Firebase configuration
├── server.ts            # Express server cho production
├── vite.config.ts       # Vite configuration
├── index.html           # HTML entry point
├── public/              # Static assets
└── dist/                # Build output (sau khi build)
```

## Các trạng thái yêu cầu hoàn tiền

| Trạng thái | Mô tả |
|------------|-------|
| `pending` | Đang chờ duyệt |
| `approved` | Đã duyệt - Đang xử lý |
| `processing` | Đang chuyển tiền |
| `completed` | Hoàn tiền thành công |
| `rejected` | Đã từ chối |

## Vai trò người dùng

| Vai trò | Mô tả |
|---------|-------|
| `admin` | Quản trị viên - Toàn quyền quản lý hệ thống |
| `user` | Khách hàng - Sử dụng tính năng cơ bản |

## Phát triển

### Scripts có sẵn

```bash
npm run dev      # Chạy chế độ phát triển
npm run build    # Build production
npm run start    # Chạy server production
npm run lint     # Kiểm tra TypeScript
npm run preview  # Xem trước build production
npm run clean    # Xóa thư mục dist
```

### Quy tắc đặt tên branch
- `feature/` - Tính năng mới
- `fix/` - Sửa lỗi
- `refactor/` - Cải thiện code
- `docs/` - Cập nhật tài liệu

## License

Apache 2.0
