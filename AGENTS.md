<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NGUYÊN TẮC VÀ QUY CHUẨN HOẠT ĐỘNG CỦA AGENT (AGENTS.MD)
## DỰ ÁN: SKY-LINE-ICT-PORTAL (CỔNG THÔNG TIN TỔ CHUYÊN MÔN ICT)

> Tài liệu này là kim chỉ nam tối thượng cho tất cả Agent tham gia phát triển, bảo trì và mở rộng hệ thống Sky-Line-ICT-Portal. Mọi hành động, đề xuất và triển khai kỹ thuật bắt buộc phải tuân thủ 100% các điều khoản dưới đây.

---

### 1. NGUYÊN TẮC BÁM SÁT KẾ HOẠCH DỰ ÁN (KE_HOACH_DU_AN.md)
- Trước khi thực hiện bất kỳ tác vụ nào (tạo tính năng, sửa đổi cơ sở dữ liệu, dựng màn hình, viết mã nguồn), Agent **BẮT BUỘC** phải đọc và đối chiếu kỹ lưỡng tệp [KE_HOACH_DU_AN.md](file:///d:/sky-line-ict-portal/KE_HOACH_DU_AN.md).
- Không tự ý thêm bớt các tính năng đi ngược lại định hướng đã duyệt giữa Giám đốc Sản phẩm (Tổ trưởng Chuyên môn ICT) và Đội ngũ Kỹ thuật.
- Mọi quyết định cốt lõi đã chốt (1A: Tổ trưởng chủ động cấp tài khoản; 2B: Thời khóa biểu & Lịch phòng Lab chi tiết chống trùng; 3A: Báo cáo tình trạng thiết bị linh hoạt theo biến động thực tế) phải được hiện thực hóa nhất quán.

---

### 2. PHONG CÁCH GIAO TIẾP VÀ BÁO CÁO: TIẾNG VIỆT BÌNH DÂN, DỄ HIỂU
- **Ngôn ngữ duy nhất:** Giao tiếp, giải thích kế hoạch, hướng dẫn và báo cáo tiến độ hoàn toàn bằng **Tiếng Việt**.
- **Cách diễn đạt:** Sử dụng văn phong gần gũi, đời thường, thân thiện với ngành sư phạm giáo dục.
- **Tuyệt đối không lạm dụng thuật ngữ kỹ thuật phức tạp:**
  - Thay vì nói: *"Chúng tôi đã cấu hình RLS policies trên PostgreSQL và migrate foreign keys với cascading delete"*
  - Hãy nói: *"Chúng tôi đã cài đặt ổ khóa bảo mật thông minh cho tủ hồ sơ số: giáo viên chỉ thấy dữ liệu của mình, còn Tổ trưởng có quyền bao quát toàn trường"*
  - Thay vì nói: *"Deploy bundle SSR qua Next.js App Router và render responsive layout"*
  - Hãy nói: *"Trang web đã sẵn sàng, hiển thị đẹp mắt và mượt mà trên cả máy tính lẫn điện thoại của thầy cô"*

---

### 3. QUY CHUẨN GIAO DIỆN NGƯỜI DÙNG (UI/UX)
- **100% Tiếng Việt có dấu chuẩn chỉnh:** Tuyệt đối không để sót các chuỗi tiếng Anh mặc định (như "Submit", "Cancel", "Loading...", "Dashboard", "Sign In"). Tất cả phải được Việt hóa tự nhiên, chuẩn mực (ví dụ: "Lưu thay đổi", "Hủy bỏ", "Đang xử lý...", "Bảng điều khiển", "Đăng nhập").
- **Nhận diện Sky-Line:** Tông màu chủ đạo là Xanh dương tri thức (#0284c7 / #0369a1) kết hợp điểm nhấn Vàng cam năng động (#f59e0b / #ea580c), giao diện sáng sủa, sang trọng, đẳng cấp.
- **Hỗ trợ Chế độ Sáng / Tối (Light / Dark mode):** Đảm bảo thầy cô làm việc ban đêm không bị mỏi mắt.

---

### 4. TỰ ĐỘNG CHẠY KIỂM TRA LỖI TRƯỚC KHI BÁO CÁO HOÀN THÀNH
- Agent phải luôn chủ động kiểm tra mã nguồn, chạy thử nghiệm hệ thống và kiểm tra lỗi (compile error, lint error, runtime crash) **TRƯỚC KHI** báo cáo cho Tổ trưởng.
- Nếu có lỗi phát sinh, Agent phải tự động phân tích và khắc phục triệt để, không đùn đẩy công việc kỹ thuật cho người dùng.
- Khi báo cáo, chỉ thông báo kết quả cụ thể, đường link truy cập và các điểm nổi bật cần trải nghiệm.
