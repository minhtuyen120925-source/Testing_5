import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Chặn toàn bộ /admin/* ở một chỗ duy nhất (không phải từng trang) — chạy
// trước khi render, không bị cache/bỏ qua khi điều hướng phía client như
// việc kiểm tra trong layout có thể gặp phải.
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.includes(pathname);

  if (!isPublicAdminPath) {
    // app_metadata do server đặt qua Admin API, người dùng không tự sửa được
    // từ phía client — dùng làm cờ phân quyền, tách biệt hoàn toàn với tài
    // khoản khách hàng ở cổng hồ sơ (dù có thể trùng email).
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!isAdmin) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
