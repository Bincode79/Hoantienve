# Báo Cáo Test AeroRefund

## Ngày test: 2026-03-22

## Tổng quan

| Module | Kết quả | Ghi chú |
|--------|---------|---------|
| Đăng nhập Admin | ✅ PASS | Token JWT hoạt động |
| Đăng nhập User | ✅ PASS | Mật khẩu đã được fix |
| API /api/auth/me | ✅ PASS | Lấy thông tin user |
| API /api/users | ✅ PASS | Danh sách 5 users |
| API /api/refunds | ✅ PASS | Danh sách yêu cầu hoàn vé |
| API /api/data/basedata | ✅ PASS | 15 PNR records |
| API /api/data/config | ✅ PASS | Cấu hình hệ thống |
| API /api/data/audit-logs | ✅ PASS | Nhật ký admin |
| Verify Token | ✅ PASS | JWT validation |

## Chi tiết Test

### 1. Đăng nhập Admin
- **Endpoint**: POST `/api/auth/login`
- **Input**: SĐT `0999999999`, Password `Admin@123`
- **Kết quả**: ✅ PASS
- **Response**: Token JWT + user profile với role `admin`

### 2. Đăng nhập User
- **Endpoint**: POST `/api/auth/login`
- **Input**: SĐT `0912345678`, Password `User@123`
- **Kết quả**: ✅ PASS
- **Response**: Token JWT + user profile với role `user`

### 3. Tạo yêu cầu hoàn vé
- **Endpoint**: POST `/api/refunds`
- **Input**: Thông tin đầy đủ (orderCode, bankName, accountNumber, etc.)
- **Kết quả**: ⚠️ Cần kiểm tra thêm (có thể tạo thành công)
- **Ghi chú**: Số lượng refunds tăng từ 0 lên 1

### 4. Danh sách Users
- **Endpoint**: GET `/api/users`
- **Kết quả**: ✅ PASS
- **Data**: 5 users (3 admin + 2 user)

### 5. Danh sách Refunds (Admin)
- **Endpoint**: GET `/api/refunds`
- **Kết quả**: ✅ PASS
- **Data**: 1 refund request

### 6. Cấu hình hệ thống
- **Endpoint**: GET `/api/data/config`
- **Kết quả**: ✅ PASS
- **Lưu ý**: Response format có thể cần điều chỉnh

## Tài khoản Test

### Admin Accounts
| SĐT | Mật khẩu | Trạng thái |
|-----|----------|-------------|
| 0999999999 | Admin@123 | ✅ Hoạt động |
| 0383165313 | Admin@123 | ✅ Hoạt động |
| 0968686868 | Admin@123 | ✅ Hoạt động |

### User Accounts
| SĐT | Mật khẩu | Trạng thái |
|-----|----------|-------------|
| 0912345678 | User@123 | ✅ Hoạt động |
| 0933888999 | User@123 | ✅ Hoạt động |

## Lỗi đã phát hiện

1. **Password User ban đầu không đúng** - Đã fix bằng script `fix-user-passwords.ts`

## Khuyến nghị

1. Kiểm tra response format của API `/api/data/config`
2. Test thêm chức năng duyệt yêu cầu hoàn vé
3. Test chức năng chat giữa user và admin
4. Test UI trên trình duyệt (agent đang chạy)
