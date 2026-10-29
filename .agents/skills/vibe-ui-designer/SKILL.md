---
name: vibe-ui-designer
description: Bộ quy chuẩn chuyên sâu về thiết kế giao diện UI/UX hiện đại, khớp 100% với kho dữ liệu Supabase, sử dụng thư viện shadcn/ui, Lucide Icons, tương thích hoàn hảo di động và máy tính, hỗ trợ chế độ Sáng/Tối, hiệu ứng phản hồi nút bấm, khung tải dữ liệu (Skeleton), trạng thái trống (Empty State) và thông báo Toast.
---

# SỔ TAY KỸ NĂNG: VIBE UI DESIGNER
## QUY CHUẨN THIẾT KẾ TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX) DỰ ÁN SKY-LINE-ICT-PORTAL

> **Mục đích:** Kỹ năng này là kim chỉ nam cho mọi tác vụ dựng màn hình, căn chỉnh bố cục, lựa chọn màu sắc và tạo hiệu ứng tương tác trong toàn bộ cổng thông tin Sky-Line-ICT-Portal. Đảm bảo giao diện luôn mang lại cảm giác sang trọng, đẳng cấp, dễ dùng và phục vụ thiết thực cho thầy cô giáo.

---

### 1. TRIẾT LÝ THIẾT KẾ & KHỚP NỐI DỮ LIỆU SUPABASE 100%

1. **Bản sắc nhận diện Sky-Line:**
   - **Màu chủ đạo:** Xanh dương tri thức (`#0284c7` / `#0369a1`) thể hiện sự chuyên nghiệp, tin cậy và công nghệ.
   - **Màu điểm nhấn:** Vàng cam năng động (`#f59e0b` / `#ea580c`) tượng trưng cho sự sáng tạo STEM/Robotics và nhiệt huyết giáo dục.
   - **Màu trung tính:** Hệ màu Slate sang trọng (`slate-50` đến `slate-900`), viền thẻ bo góc mềm mại (`rounded-2xl`).
2. **Khớp 100% với các cột dữ liệu Supabase:**
   - Mỗi ô nhập liệu (Input/Select) trên biểu mẫu và mỗi cột hiển thị trên bảng bắt buộc phải khớp đúng tên trường dữ liệu trong CSDL (ví dụ: `school_year_id`, `campus_id`, `room_or_lab`, `period`, `status`, `assigned_to`).
   - Tuyệt đối không thiết kế các trường ảo không thể lưu trữ hoặc quên hiển thị các thông tin cốt lõi đã quy định trong [KE_HOACH_DU_AN.md](file:///d:/sky-line-ict-portal/KE_HOACH_DU_AN.md).

---

### 2. BỘ THƯ VIỆN GIAO DIỆN CHUẨN (SHADCN/UI & LUCIDE ICONS)

Mọi thành phần giao diện phải được xây dựng từ các viên gạch chuẩn mực của **shadcn/ui** và **Lucide Icons**:

| Thành phần | Sử dụng cho nghiệp vụ gì | Biểu tượng Lucide đi kèm |
| :--- | :--- | :--- |
| **Button** | Nút bấm thao tác chính (Lưu, Thêm mới, Xếp lịch, Báo hỏng) | `PlusCircle`, `Check`, `Calendar`, `AlertTriangle` |
| **Card** | Thẻ danh thiếp giáo viên, thẻ thiết bị robot, thẻ thành tích | `Users`, `Bot`, `Trophy`, `Laptop` |
| **Badge** | Nhãn trạng thái (Đang làm, Cần sửa, Hoạt động tốt, Khẩn cấp) | `CheckCircle2`, `Clock`, `Sparkles`, `ShieldCheck` |
| **Dialog / Modal** | Cửa sổ bật lên khi nhập thông tin xếp lịch hoặc sửa hồ sơ | `X`, `Layers`, `Settings` |
| **Tabs** | Chuyển đổi giữa các góc nhìn Thời khóa biểu hoặc Cơ sở | `Calendar`, `MapPin`, `School` |

---

### 3. TƯƠNG THÍCH ĐA THIẾT BỊ (RESPONSIVE: MÁY TÍNH & ĐIỆN THOẠI)

Thầy cô thường xuyên dùng điện thoại di động khi đang ở phòng Lab hoặc dùng máy tính khi ở bàn làm việc:

1. **Nguyên tắc không vỡ khung:**
   - Tuyệt đối không để xảy ra hiện tượng tràn lề ngang màn hình trên thiết bị di động.
   - Sử dụng các lớp tiện ích co giãn linh hoạt: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`.
2. **Bảng dữ liệu & Lưới Thời khóa biểu lớn:**
   - Luôn bọc trong khung cuộn ngang mượt mà: `overflow-x-auto no-scrollbar rounded-2xl`.
   - Cột cố định (Sticky column) cho khung giờ/tiết học để khi vuốt ngang trên điện thoại, thầy cô vẫn biết mình đang xem tiết mấy.
3. **Thanh điều hướng di động:**
   - Tự động thu gọn các nút chức năng phụ vào menu gọn gàng khi hiển thị trên màn hình nhỏ.

---

### 4. HỖ TRỢ CHẾ ĐỘ SÁNG VÀ TỐI (LIGHT / DARK MODE)

Chuyển đổi giao diện tức thì, bảo vệ mắt thầy cô khi soạn giáo án đêm muộn:

```tsx
// Quy chuẩn màu sắc 2 chế độ
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800"
```
- **Chế độ Sáng (Light):** Nền trắng sáng kết hợp xám nhạt dịu mắt, bóng đổ nhẹ nhàng (`shadow-sm`).
- **Chế độ Tối (Dark):** Nền xám đen sang trọng (`bg-slate-950` hoặc `bg-slate-900`), độ tương phản chữ cao, viền thẻ mờ tinh tế.

---

### 5. TRẠNG THÁI TƯƠNG TÁC & PHẢN HỒI NGƯỜI DÙNG (INTERACTIONS & FEEDBACK)

Để ứng dụng không bao giờ bị "đơ" hay thiếu phản hồi khi sử dụng, mọi màn hình phải triển khai đầy đủ 4 trạng thái tương tác:

#### A. Trạng thái Bấm nút (Button Loading State):
Khi người dùng bấm Lưu, Thêm, hoặc Gửi báo cáo:
- Tự động hiển thị vòng xoay xử lý `Loader2` xoay tròn (`animate-spin`).
- Vô hiệu hóa nút bấm (`disabled={isLoading}`) để chống bấm trùng lặp nhiều lần.
- Đổi nhãn nút từ *"Lưu dữ liệu"* sang *"Đang xử lý..."*.

#### B. Khung xương tải dữ liệu (Skeleton Loading):
Trong lúc hệ thống đang lấy dữ liệu từ Supabase (mất từ 0.5 - 1.5 giây):
- Tuyệt đối không để màn hình trắng xóa hoặc hiện chữ "Đang tải...".
- Hiển thị các dải thẻ mờ giả lập (`Skeleton`) có hiệu ứng nhấp nháy êm dịu (`animate-pulse`) mô phỏng đúng kích thước các bảng và danh thiếp.

#### C. Trạng thái dữ liệu trống (Empty State):
Khi một cơ sở chưa có thiết bị nào hoặc một giáo viên chưa được phân công tiết dạy:
- Hiển thị khối hình ảnh minh họa thân thiện với biểu tượng lớn mờ (`w-12 h-12 text-slate-300`).
- Dòng thông điệp ân cần bằng tiếng Việt: *"Hiện chưa có dữ liệu nào trong danh mục này."*
- Kèm ngay một nút bấm hành động gợi mở: `[+ Thêm dữ liệu đầu tiên ngay]`.

#### D. Thông báo nổi góc màn hình (Toast Notification):
- Mọi thao tác thành công (Thêm lớp, đổi giờ dạy, báo hỏng robot) phải bật một hộp thông báo nổi góc dưới bên phải màn hình:
  + Màu xanh lá (`emerald`) cho thao tác thành công: *"Đã lưu thay đổi thời khóa biểu thành công!"*.
  + Màu cam đỏ cho cảnh báo sự cố: *"Không thể lưu: Tiết này phòng Lab đã có lớp đăng ký!"*.
- Tự động ẩn nhẹ nhàng sau 3 đến 4 giây.

---

### 6. QUY CHUẨN NGÔN NGỮ GIAO DIỆN (100% TIẾNG VIỆT CÓ DẤU)

Bắt buộc tuân thủ điều khoản trong [AGENTS.md](file:///d:/sky-line-ict-portal/AGENTS.md):
- Không dùng: *Submit* ➔ Dùng: **"Lưu Thay Đổi"** hoặc **"Xác Nhận"**
- Không dùng: *Cancel* ➔ Dùng: **"Hủy Bỏ"** hoặc **"Đóng Lại"**
- Không dùng: *Delete* ➔ Dùng: **"Xóa Bản Ghi"** (kèm hộp thoại hỏi lại)
- Không dùng: *Search...* ➔ Dùng: **"Tìm kiếm giáo viên, thiết bị, lớp dạy..."**
- Không dùng: *Dashboard* ➔ Dùng: **"Bảng Điều Khiển Tổng Quan"**
- Không dùng: *Edit* ➔ Dùng: **"Chỉnh Sửa"**
