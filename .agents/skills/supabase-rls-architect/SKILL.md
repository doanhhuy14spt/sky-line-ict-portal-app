---
name: supabase-rls-architect
description: Hướng dẫn và quy chuẩn thiết kế cơ sở dữ liệu Supabase kèm khiên bảo mật từng dòng dữ liệu (Row Level Security - RLS), tự động đồng bộ bảng hồ sơ người dùng (profiles) và kiểm soát phân quyền chặt chẽ bám sát KE_HOACH_DU_AN.md.
---

# SỔ TAY KỸ NĂNG: SUPABASE RLS ARCHITECT
## QUY CHUẨN THIẾT KẾ KHO DỮ LIỆU & BẢO MẬT DỰ ÁN SKY-LINE-ICT-PORTAL

> **Mục đích:** Kỹ năng này đóng vai trò là "Bộ quy chuẩn xây dựng móng" cho toàn bộ cơ sở dữ liệu trên Supabase. Mọi Agent khi thiết kế bảng, viết lệnh SQL hoặc cấu hình hệ thống lưu trữ đều bắt buộc phải tuân thủ nghiêm ngặt các điều khoản trong tài liệu này.

---

### 1. NGUYÊN TẮC BẤT DI BẤT DỊCH KHI TẠO BẢNG DỮ LIỆU

1. **Bám sát 100% Kế hoạch Dự án ([KE_HOACH_DU_AN.md](file:///d:/sky-line-ict-portal/KE_HOACH_DU_AN.md)):**
   - Chỉ tạo các bảng nằm trong danh mục đã được phê duyệt: `school_years` (Năm học), `campuses` (Cơ sở), `profiles` (Hồ sơ), `facilities_and_devices` (Thiết bị/Lab), `teaching_assignments` (Phân công chuyên môn), `timetables` (Thời khóa biểu & Lịch Lab), `achievements` (Thành tích), `tasks_and_projects` (Công việc), `annual_goals` (Mục tiêu năm học).
2. **Cột định danh chủ sở hữu (`user_id`):**
   - Mọi bảng liên quan đến dữ liệu cá nhân, phân công, công việc, thiết bị, thành tích đều **BẮT BUỘC** có cột `user_id` kiểu `UUID`.
   - Cột `user_id` phải liên kết trực tiếp với bảng tài khoản người dùng của hệ sinh thái Supabase:
     ```sql
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
     ```
3. **Cột lưu thời gian tự động:**
   - Mọi bảng đều phải có cột thời gian tạo mặc định:
     ```sql
     created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
     ```

---

### 2. BẢNG HỒ SƠ NGƯỜI DÙNG (`profiles`) VÀ BỘ KÍCH HOẠT TỰ ĐỘNG (TRIGGER)

Bảng `profiles` là "chìa khóa định danh" kết nối giữa tài khoản đăng nhập (`auth.users`) và thông tin nghiệp vụ thực tế của thầy cô tại Sky-Line.

#### Cấu trúc bảng `profiles`:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  campus_id TEXT DEFAULT 'riverside',
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('leader', 'teacher')),
  specialty TEXT DEFAULT '',
  lab_management TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

#### Cơ chế tự động điền hồ sơ (Auto Trigger on Auth Signup):
Ngay khi Tổ trưởng tạo tài khoản mới cho giáo viên (hoặc giáo viên đăng ký), hệ thống phải tự động kích hoạt hàm và sao chép thông tin cơ bản sang bảng `profiles`:

```sql
-- 1. Hàm tự động xử lý hồ sơ mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bộ kích hoạt tự động sau khi tạo người dùng trong auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 3. QUY CHUẨN KHIÊN BẢO MẬT TỪNG DÒNG (ROW LEVEL SECURITY - RLS)

#### Điều kiện tiên quyết: Bật RLS ngay khi vừa tạo bảng
Tuyệt đối không được để bất kỳ bảng nào mở cửa tự do. Ngay sau câu lệnh `CREATE TABLE`, phải chạy ngay:
```sql
ALTER TABLE public.ten_bang_du_lieu ENABLE ROW LEVEL SECURITY;
```

#### Thiết lập 4 quy tắc bảo mật (SELECT, INSERT, UPDATE, DELETE):
Nguyên tắc cốt lõi: **"Dữ liệu của ai, người đó quản lý. Tuyệt đối không để rò rỉ dữ liệu giữa các tài khoản khác nhau."**

```sql
-- 1. QUY TẮC XEM (SELECT): Chỉ người sở hữu mới được xem dữ liệu của mình
CREATE POLICY "Nguoi dung chi xem du lieu cua chinh minh"
  ON public.ten_bang_du_lieu
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. QUY TẮC THÊM (INSERT): Người dùng chỉ được thêm bản ghi gắn với id của chính mình
CREATE POLICY "Nguoi dung chi them du lieu cua chinh minh"
  ON public.ten_bang_du_lieu
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. QUY TẮC SỬA (UPDATE): Chỉ người sở hữu mới được sửa dữ liệu của mình
CREATE POLICY "Nguoi dung chi sua du lieu cua chinh minh"
  ON public.ten_bang_du_lieu
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. QUY TẮC XÓA (DELETE): Chỉ người sở hữu mới được xóa dữ liệu của mình
CREATE POLICY "Nguoi dung chi xoa du lieu cua chinh minh"
  ON public.ten_bang_du_lieu
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

### 4. ĐẶC QUYỀN CỦA TỔ TRƯỞNG CHUYÊN MÔN (LEADER ROLE)

Theo đúng bài toán tại [KE_HOACH_DU_AN.md](file:///d:/sky-line-ict-portal/KE_HOACH_DU_AN.md), Tổ trưởng Chuyên môn có quyền quản trị bao quát toàn trường trên cả 5 cơ sở (để xếp thời khóa biểu, giao việc, tổng hợp thành tích và theo dõi phòng Lab).

Để hỗ trợ điều này một cách an toàn mà vẫn giữ khiên bảo mật, ta định nghĩa hàm kiểm tra quyền Tổ trưởng:

```sql
-- Hàm kiểm tra xem người đang thao tác có phải là Tổ trưởng hay không
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Khi đó, đối với các bảng mang tính công khai nội bộ trong tổ (như Thời khóa biểu chung, Danh mục thiết bị trường, Mục tiêu năm học), chính sách RLS sẽ được mở rộng linh hoạt:
- **Xem công khai trong tổ:** Mọi giáo viên đã đăng nhập đều được xem lịch chung để phối hợp:
  ```sql
  CREATE POLICY "Giao vien duoc xem thoi khoa bieu chung"
    ON public.timetables
    FOR SELECT
    USING (auth.role() = 'authenticated');
  ```
- **Chỉnh sửa / Xếp lịch:** Chỉ Tổ trưởng (`is_leader()`) hoặc chính giáo viên được phân công mới có quyền can thiệp.

---

### 5. DANH SÁCH KIỂM TRA BẮT BUỘC TRƯỚC KHI BÀN GIAO (CHECKLIST)

Mỗi khi Agent chạy mã SQL tạo bảng trên Supabase, phải tự động kiểm tra lại từng mục sau:
- [ ] Bảng đã có khóa chính `id UUID DEFAULT gen_random_uuid()`?
- [ ] Bảng đã có `user_id` tham chiếu `auth.users(id)` đúng chuẩn?
- [ ] Bảng đã có `created_at` và `updated_at`?
- [ ] Lệnh `ENABLE ROW LEVEL SECURITY` đã được chạy thành công?
- [ ] Đã có đủ 4 chính sách bảo vệ (Xem, Thêm, Sửa, Xóa) chống truy cập trái phép từ bên ngoài?
- [ ] Đã thử nghiệm truy vấn kiểm tra quyền với một tài khoản mẫu để đảm bảo khiên bảo mật hoạt động 100%?
