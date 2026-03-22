# Test Checklist - Hệ Thống Hoàn Tiền Vé Máy Bay

**Ngày test**: 22/03/2026  
**Phiên bản**: v1.0 (sau khi xóa 4 tính năng)

---

## 1. TÍNH NĂNG XÁC THỰC (Authentication)

### 1.1 Đăng Ký Tài Khoản (Register)
- [ ] Truy cập trang chủ và click "Đăng Ký"
- [ ] Nhập Họ và tên, Email, SDT, Mật khẩu
- [ ] Click "Đăng Ký" - Tài khoản được tạo thành công
- [ ] Xác nhận nhận được thông báo "Đăng ký thành công"
- [ ] Có thể đăng nhập bằng email/password mới

### 1.2 Đăng Nhập (Login)
- [ ] (Nếu đăng nhập bằng SĐT) Đã tạo hàm `lookup_login_email_by_phone` trên Supabase (`supabase_schema.sql`)
- [ ] Click "Đăng Nhập" trên trang chủ
- [ ] Nhập email và mật khẩu đúng → vào dashboard
- [ ] Nhập SĐT đã đăng ký + mật khẩu đúng → vào dashboard (email phải có trong `public.users`)
- [ ] Thử đăng nhập sai mật khẩu - Nhận lỗi
- [ ] Thử email/SĐT không tồn tại - Nhận lỗi

### 1.3 Đăng Xuất (Logout)
- [ ] Sau khi đăng nhập, click menu -> "Đăng Xuất"
- [ ] Quay lại trang đăng nhập
- [ ] Không thể truy cập dashboard khi chưa đăng nhập

---

## 2. DASHBOARD KHÁCH HÀNG (User Dashboard)

### 2.1 Giao diện Dashboard
- [ ] Hiển thị 4 thẻ thống kê:
  - [ ] Tổng yêu cầu
  - [ ] Đang chờ (Pending + Approved)
  - [ ] Chuyển tiền (Processing)
  - [ ] Hoàn tất (Completed)
- [ ] Hiển thị danh sách yêu cầu hoàn tiền
- [ ] Hiển thị thôi gian hiện tại và tên người dùng

### 2.2 Tạo Yêu Cầu Hoàn Vé
- [ ] Click "TẠO YÊU CẦU MỚI"
- [ ] Nhập các thông tin:
  - [ ] Mã PNR
  - [ ] Ngân hàng
  - [ ] Số tài khoản
  - [ ] Chủ tài khoản
  - [ ] Số tiền
  - [ ] Ngày bay (optional)
  - [ ] Mã vé (optional)
  - [ ] Tên hành khách (optional)
  - [ ] Lý do hoàn (optional)
- [ ] Click "GỬI" - Yêu cầu được tạo thành công
- [ ] Yêu cầu mới xuất hiện trong danh sách với trạng thái "pending"

### 2.3 Xem Chi Tiết Yêu Cầu
- [ ] Click vào một yêu cầu trong danh sách
- [ ] Hiển thị modal với thông tin chi tiết:
  - [ ] Mã PNR
  - [ ] Thông tin ngân hàng
  - [ ] Trạng thái
  - [ ] Ngày tạo, cập nhật
  - [ ] Ghi chú admin (nếu có)
  - [ ] Lịch sử thay đổi trạng thái
- [ ] Có nút "Đóng" để tắt modal

### 2.4 Tìm Kiếm & Lọc Yêu Cầu
- [ ] Nhập mã PNR trong ô tìm kiếm - Lọc kết quả
- [ ] Nhập tên ngân hàng - Lọc kết quả
- [ ] Click các nút lọc trạng thái:
  - [ ] "Tất cả"
  - [ ] "Chờ duyệt"
  - [ ] "Đã duyệt"
  - [ ] "Đang xử lý"
  - [ ] "Hoàn tất"
  - [ ] "Từ chối"
- [ ] Kết hợp tìm kiếm + lọc - Hoạt động chính xác

### 2.5 Sắp Xếp & Phân Trang
- [ ] Click vào header các cột để sắp xếp (ascending/descending)
- [ ] Danh sách hiển thị 10 yêu cầu/trang
- [ ] Click nút phân trang để chuyển trang
- [ ] Hiển thị "Không có dữ liệu" khi danh sách rỗng

---

## 3. DASHBOARD QUẢN TRỊ VIÊN (Admin Dashboard)

### 3.1 Giao diện Dashboard Admin
- [ ] Hiển thị 4 thẻ thống kê:
  - [ ] Tổng số yêu cầu
  - [ ] Đang chờ
  - [ ] Chuyển tiền
  - [ ] Hoàn tát
- [ ] Hiển thị danh sách yêu cầu gần đây
- [ ] Hiển thị danh sách người dùng gần đây
- [ ] Hiển thị thống kê cơ sở dữ liệu

### 3.2 Quản Lý Người Dùng (User Management)
- [ ] Truy cập tab "Quản Lý Người Dùng"
- [ ] Hiển thị danh sách tất cả người dùng
- [ ] Tìm kiếm người dùng theo:
  - [ ] Họ và tên
  - [ ] Email
  - [ ] SDT
- [ ] Lọc theo vai trò (Admin/User)
- [ ] Lọc theo trạng thái (Active/Inactive)
- [ ] Click "Chỉnh sửa" để cập nhật người dùng:
  - [ ] Cập nhật tên, email, SDT
  - [ ] Thay đổi vai trò
  - [ ] Khóa/Mở khóa tài khoản
  - [ ] Đặt lại mật khẩu
  - [ ] Click "Lưu" - Cập nhật thành công
- [ ] Click "Khóa" để khóa người dùng - Trạng thái thành "inactive"
- [ ] Xác nhận action trước khi thực hiện

### 3.3 Xử Lý Yêu Cầu Hoàn Tiền (Refund Request Management)
- [ ] Truy cập tab "Xử Lý Yêu Cầu Hoàn"
- [ ] Hiển thị danh sách tất cả yêu cầu
- [ ] Tìm kiếm theo mã PNR, email người dùng
- [ ] Lọc theo trạng thái
- [ ] Click nút action trên từng yêu cầu:
  - [ ] **Duyệt (Approve)**:
    - Nhập ghi chú (optional)
    - Click "Duyệt"
    - Trạng thái thay đổi thành "approved"
  - [ ] **Từ chối (Reject)**:
    - Nhập lý do từ chối
    - Click "Từ chối"
    - Trạng thái thay đổi thành "rejected"
  - [ ] **Xử lý (Process)**:
    - Nhập mã phiếu hoàn, ghi chú
    - Click "Xử lý"
    - Trạng thái thay đổi thành "processing"
  - [ ] **Hoàn tất (Complete)**:
    - Nhập ghi chú (optional)
    - Click "Hoàn tất"
    - Trạng thái thay đổi thành "completed"
- [ ] Chỉnh sửa yêu cầu:
  - [ ] Click biểu tượng "chỉnh sửa"
  - [ ] Sửa thông tin: ghi chú, trạng thái
  - [ ] Click "Lưu"
- [ ] Thay đổi trạng thái từng yêu cầu
- [ ] Bulk action: chọn nhiều yêu cầu:
  - [ ] Chọn checkbox "Chọn tất cả" hoặc chọn từng item
  - [ ] Chọn hành động (Duyệt, Từ chối, Xử lý, Hoàn tát)
  - [ ] Click "Áp dụng" - Tất cả được cập nhật cùng lúc
- [ ] Ẩn/Hiện yêu cầu:
  - [ ] Click biểu tượng mắt để ẩn/hiện yêu cầu
  - [ ] Yêu cầu ẩn không xuất hiện ở trang khách

---

## 4. QUẢN LÝ MÃ ĐẶT CHỖ (Booking Management)

### 4.1 Booking Codes List
- [ ] Truy cập tab "Quản Lý Booking"
- [ ] Hiển thị danh sách mã đặt chỗ (PNR)
- [ ] Hiển thị các cột: Mã PNR, Hành khách, Số tiền, Trạng thái
- [ ] Tìm kiếm theo mã PNR
- [ ] Lọc theo trạng thái (valid/refunded)

---

## 5. CÀI ĐẶT CÁ NHÂN (Profile Settings)

### 5.1 Cập Nhật Thông Tin
- [ ] Truy cập tab "Cài Đặt"
- [ ] Hiển thị form với các thông tin:
  - [ ] Email (read-only hoặc editable)
  - [ ] Họ và tên
  - [ ] Số điện thoại
  - [ ] Vai trò (read-only)
  - [ ] Trạng thái (read-only)
- [ ] Cập nhật thông tin cá nhân
- [ ] Click "Lưu thay đổi"
- [ ] Thông báo "Cập nhật thành công"
- [ ] Nút "Lưu" bị disable khi không có thay đổi

---

## 6. TÍNH NĂNG GIAO DIỆN

### 6.1 Dark Mode
- [ ] Click nút Dark/Light mode ở header
- [ ] Giao diện chuyển đổi giữa dark/light mode
- [ ] Theme được lưu vào localStorage
- [ ] Trạng thái được giữ lại khi reload trang

### 6.2 Notification Bell
- [ ] Notification bell hiển thị số lượng yêu cầu chưa xử lý
- [ ] Click notification bell:
  - [ ] Với user: hiển thị số lượng đang xử lý
  - [ ] Với admin: hiển thị số lượng pending

### 6.3 Navigation
- [ ] Menu sidebar hiển thị các tab phù hợp:
  - [ ] User: Dashboard, Yêu Cầu, Cài Đặt
  - [ ] Admin: Dashboard, Quản Lý User, Xử Lý Yêu Cầu, Quản Lý Booking, Cài Đặt
- [ ] Click các tab để chuyển đổi view
- [ ] Menu collapse/expand trên mobile

### 6.4 Thông Báo (Toast)
- [ ] Thực hiện các action xảy ra lỗi:
  - [ ] Hiển thị toast lỗi (màu đỏ)
  - [ ] Thực hiện action thành công:
  - [ ] Hiển thị toast thành công (màu xanh)
- [ ] Toast tự động đóng sau 3-5 giây

---

## 7. TÍNH NĂNG DATA (Mock Data)

### 7.1 Seed Data
- [ ] Admin Dashboard: Click "Seed Dữ Liệu"
- [ ] Thêm 5 yêu cầu mẫu vào cơ sở dữ liệu
- [ ] Yêu cầu mới xuất hiện trong danh sách

### 7.2 Reset Collection
- [ ] Admin Dashboard: Chọn collection cần xóa
- [ ] Click "Xóa" - Xác nhận
- [ ] Collection được xóa sạch

### 7.3 Export/Import Database
- [ ] Click "Xuất JSON" - Tải file JSON dữ liệu xuống
- [ ] Click "Nhập JSON" - Chọn file JSON
- [ ] Dữ liệu được import thành công

---

## 8. RESPONSIVE & PERFORMANCE

### 8.1 Desktop (1920px+)
- [ ] Tất cả các tính năng hoạt động bình thường
- [ ] Layout full width, không có scroll horizontal

### 8.2 Tablet (768px - 1024px)
- [ ] Bố cục responsive, điều chỉnh cho màn hình nhỏ
- [ ] Các bảng hiển thị đúng
- [ ] Form dễ nhập trên touch device

### 8.3 Mobile (< 768px)
- [ ] Menu collapse thành hamburger
- [ ] Các bảng có scroll horizontal
- [ ] Các button dễ bấm (kích thước >= 44px)
- [ ] Form chiếm full width

### 8.4 Performance
- [ ] Trang load trong < 3 giây
- [ ] Không có lag khi scroll danh sách
- [ ] Không có error console

---

## 9. EDGE CASES

### 9.1 Validations
- [ ] Không thể tạo yêu cầu nếu thiếu thông tin bắt buộc
- [ ] Email phải có định dạng @
- [ ] Số tiền phải > 0
- [ ] Số điện thoại phải có đúng 10-11 chữ số

### 9.2 Permissions
- [ ] User không thể truy cập tab Admin
- [ ] Admin không thể xem yêu cầu user khác (chỉ xem người dùng của họ)
- [ ] Người dùng inactive không thể đăng nhập

### 9.3 Concurrent Operations
- [ ] Mở 2 tab cùng người dùng - Cập nhật realtime giữa 2 tab
- [ ] Cập nhật yêu cầu ở 1 tab - 1 tab kia tự động cập nhật

---

## 10. ✅ LƯU Ý - TÍNH NĂNG ĐÃ XÓA

Các tính năng dưới đây đã bị xóa khỏi hệ thống:
- ❌ Chat với Admin
- ❌ Xuất báo cáo CSV
- ❌ Gửi thông báo FCM
- ❌ Xem nhật ký hoạt động (Audit Log)

---

## Test Result Summary

| Tính năng | Status | Ghi chú |
|----------|--------|---------|
| Đăng ký | [ ] |  |
| Đăng nhập | [ ] |  |
| Đăng xuất | [ ] |  |
| Dashboard User | [ ] |  |
| Tạo yêu cầu | [ ] |  |
| Xem chi tiết | [ ] |  |
| Tìm kiếm & lọc | [ ] |  |
| Dashboard Admin | [ ] |  |
| Quản lý user | [ ] |  |
| Xử lý yêu cầu | [ ] |  |
| Bulk action | [ ] |  |
| Booking management | [ ] |  |
| Cài đặt cá nhân | [ ] |  |
| Dark mode | [ ] |  |
| Responsive | [ ] |  |
| Performance | [ ] |  |

---

**Người test**: _________________  
**Ngày hoàn thành**: _________________  
**Kết luận**: ☐ Pass ☐ Fail
