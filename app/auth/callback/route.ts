import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

// Trang khách bấm vào từ link trong email magic link. Đổi "code" lấy phiên
// đăng nhập thật (đặt cookie phiên), rồi chuyển hướng vào cổng hồ sơ.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";

  if (code) {
    try {
      const supabase = await createSupabaseAuthServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("Supabase exchangeCodeForSession error:", error);
    } catch (error) {
      console.error("Auth callback error:", error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=1`);
}
