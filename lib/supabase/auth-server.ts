import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase Auth dùng publishable/anon key, gắn với cookie phiên của
// trình duyệt — khác với lib/supabase/server.ts (dùng secret key, bỏ qua RLS,
// chỉ cho các thao tác đọc/ghi dữ liệu nội bộ). File này CHỈ dùng cho luồng
// đăng nhập magic link (gửi OTP, đổi code lấy phiên đăng nhập).
export async function createSupabaseAuthServerClient() {
  const cookieStore = await cookies();
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_PUBLISHABLE_KEY trên server.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component không được phép ghi cookie — bỏ qua, chỉ Route
          // Handler/Server Action mới thực sự cần setAll ở đây.
        }
      },
    },
  });
}
