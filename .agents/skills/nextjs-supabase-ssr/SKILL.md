---
name: nextjs-supabase-ssr
description: Quy chuẩn kết nối Next.js App Router với Supabase qua @supabase/ssr, duy trì phiên đăng nhập bền vững qua Cookie, thiết lập Middleware bảo vệ tuyến đường và cập nhật dữ liệu tự động không cần F5.
---

# SỔ TAY KỸ NĂNG: NEXTJS SUPABASE SSR
## QUY TRÌNH KẾT NỐI GIAO DIỆN NEXT.JS VỚI KHO DỮ LIỆU SUPABASE

> **Mục đích:** Kỹ năng này cung cấp giải pháp chuẩn mực để kết nối ứng dụng Next.js (App Router) với cơ sở dữ liệu Supabase, giải quyết triệt để 3 vấn đề lớn: Không bao giờ bị văng tài khoản khi tải lại trang, chặn người lạ vào trang nội bộ và tự động làm mới dữ liệu 1 chạm mà không cần bấm F5.

---

### 1. QUẢN LÝ PHIÊN ĐĂNG NHẬP HIỆN ĐẠI (@supabase/ssr & COOKIE)

Tuyệt đối không lưu mã đăng nhập trong bộ nhớ tạm (`localStorage`) vì sẽ làm mất phiên đăng nhập khi giáo viên đóng tab hoặc bấm F5, đồng thời không tương thích với mô hình kết xuất trên máy chủ (Server-Side Rendering - SSR).

#### Quy chuẩn bắt buộc: Sử dụng gói `@supabase/ssr`
Toàn bộ mã phiên đăng nhập (JWT & Refresh Token) được lưu trữ an toàn trong **HTTP-Only Cookies**. Trình duyệt sẽ tự động đính kèm cookie này trong mọi yêu cầu gửi lên máy chủ.

#### Cấu trúc thư mục chuẩn cho Supabase Client:
```
src/lib/supabase/
  ├── client.ts       # Dành cho các thành phần giao diện tương tác (Client Components)
  ├── server.ts       # Dành cho các trang kết xuất trên máy chủ (Server Components / Actions)
  └── middleware.ts   # Dành riêng cho Người gác cổng tự động (Middleware)
```

#### A. Bộ tạo kết nối trên trình duyệt (`src/lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### B. Bộ tạo kết nối trên máy chủ (`src/lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Trường hợp gọi từ Server Component thuần túy
          }
        },
      },
    }
  );
}
```

---

### 2. THIẾT LẬP NGƯỜI GÁC CỔNG TỰ ĐỘNG (MIDDLEWARE)

Tệp `src/middleware.ts` đóng vai trò là "Bác bảo vệ số" túc trực 24/7 ở cổng ra vào của ứng dụng.

#### Nhiệm vụ của Người gác cổng:
1. **Kiểm tra vé vào cổng (Phiên đăng nhập):** Tự động làm mới cookie đăng nhập để phiên làm việc của thầy cô không bị ngắt quãng giữa chừng.
2. **Ngăn chặn truy cập trái phép:** Nếu người dùng **chưa đăng nhập** mà cố tình gõ link vào các khu vực nội bộ (`/dashboard`, `/timetable`, `/facilities`, `/tasks`), hệ thống tự động giữ lại và chuyển hướng về trang `/login`.
3. **Chống đăng nhập lặp lại:** Nếu người dùng **đã đăng nhập thành công** mà bấm vào trang `/login`, hệ thống tự động đưa thẳng vào trang Bảng điều khiển chính (`/dashboard`).

#### Mã nguồn Người gác cổng chuẩn (`src/middleware.ts`):
```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Lấy thông tin tài khoản hiện tại
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname === '/login';
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/timetable') ||
                          request.nextUrl.pathname.startsWith('/facilities');

  // Chưa đăng nhập mà vào trang bảo vệ -> Đưa về /login
  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Đã đăng nhập mà vào lại trang /login -> Đưa thẳng vào /dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

### 3. TỰ ĐỘNG LÀM MỚI DỮ LIỆU TỨC THÌ (KHÔNG CẦN BẤM F5)

Khi giáo viên hoặc Tổ trưởng thực hiện thao tác **Thêm tiết dạy mới, Sửa lịch trực Lab, hoặc Báo hỏng thiết bị**, kết quả phải hiển thị ngay trên màn hình mà không bao giờ bắt người dùng phải bấm nút tải lại trang thủ công.

#### Phương pháp 1: Kết hợp `router.refresh()` từ `next/navigation`
Sau khi câu lệnh Supabase trả về kết quả thành công, lập tức kích hoạt làm mới dữ liệu máy chủ:
```typescript
'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ReportIncidentButton({ deviceId, onDone }: { deviceId: string; onDone: () => void }) {
  const router = useRouter();
  const supabase = createClient();

  const handleReport = async () => {
    const { error } = await supabase
      .from('facilities_and_devices')
      .update({ status: 'broken' })
      .eq('id', deviceId);

    if (!error) {
      // 1. Kích hoạt cập nhật dữ liệu Server Component ngay tức thì
      router.refresh();
      // 2. Báo thông báo thành công cho người dùng
      onDone();
    }
  };

  return <button onClick={handleReport}>Báo Sự Cố 1 Chạm</button>;
}
```

#### Phương pháp 2: Sử dụng Server Actions với `revalidatePath`
Nếu thao tác thông qua Server Actions trên Next.js:
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addTimetableSlot(formData: FormData) {
  const supabase = await createClient();
  // Thao tác chèn dữ liệu vào bảng timetables...
  await supabase.from('timetables').insert({ ... });

  // Tự động xóa bộ nhớ đệm và làm mới đường dẫn này ngay lập tức!
  revalidatePath('/timetable');
  revalidatePath('/dashboard');
}
```

#### Phương pháp 3: Lắng nghe biến động tức thời (Supabase Realtime)
Đối với màn hình **Thời khóa biểu** và **Phòng Lab**, khi 1 giáo viên vừa đăng ký phòng, tất cả các giáo viên khác đang mở trang web cũng sẽ nhìn thấy khung giờ đó chuyển sang màu đỏ ngay lập tức:
```typescript
useEffect(() => {
  const supabase = createClient();
  const channel = supabase
    .channel('realtime_timetables')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'timetables' }, () => {
      router.refresh(); // Tự động làm mới ngay khi có người khác đổi lịch!
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [router]);
```

---

### 4. DANH SÁCH KIỂM TRA BẮT BUỘC KHI KẾT NỐI (CHECKLIST)
- [ ] Gói `@supabase/ssr` đã được cài đặt trong `package.json`.
- [ ] Các biến môi trường `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` được định cấu hình đúng trong `.env.local`.
- [ ] Đã thử nghiệm đăng nhập, bấm F5 hoặc đóng tab mở lại mà tài khoản vẫn được duy trì.
- [ ] Đã thử nghiệm đăng xuất và kiểm tra xem Người gác cổng (`middleware`) có chặn truy cập trái phép không.
- [ ] Mọi hành động Thêm/Sửa/Xóa đều tự động phản chiếu lên giao diện mà không cần reload trang.
