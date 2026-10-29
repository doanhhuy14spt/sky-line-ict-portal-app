import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // Helper chuyển hướng kèm bảo toàn cookies (bao gồm cả cookie đã cập nhật hoặc xóa)
  const createRedirect = (urlPath: string) => {
    const redirectUrl = new URL(urlPath, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Lấy thông tin tài khoản người dùng an toàn, xử lý triệt để lỗi refresh token cũ/hỏng
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    } else if (error) {
      // Khi gặp lỗi refresh token không tìm thấy hoặc hết hạn (refresh_token_not_found)
      // Dọn dẹp sạch sẽ các cookie xác thực cũ trên trình duyệt để tránh lặp lại lỗi
      const isRefreshTokenIssue =
        error.status === 400 ||
        (error as any).code === "refresh_token_not_found" ||
        (error as any).code === "refresh_token_already_used" ||
        error.message?.toLowerCase().includes("refresh token");

      if (isRefreshTokenIssue) {
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.includes("sb-") || cookie.name.includes("auth-token")) {
            response.cookies.delete(cookie.name);
          }
        });
      }
    }
  } catch {
    // Không để unhandled exception làm sập luồng middleware
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/login";
  const isProtectedPage = pathname.startsWith("/dashboard");
  const isRootPage = pathname === "/";

  // Khi truy cập trang chủ (/): Nếu đã đăng nhập thì vào /dashboard, nếu chưa thì chuyển về /login
  if (isRootPage) {
    if (user) {
      return createRedirect("/dashboard");
    } else {
      return createRedirect("/login");
    }
  }

  // Chưa đăng nhập mà cố tình truy cập vào trang Bảng điều khiển -> Chuyển về /login
  if (!user && isProtectedPage) {
    return createRedirect("/login");
  }

  // Đã đăng nhập rồi mà quay lại trang /login -> Đưa thẳng vào /dashboard
  if (user && isAuthPage) {
    return createRedirect("/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
