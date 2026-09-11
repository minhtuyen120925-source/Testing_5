import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu." }, { status: 400 });
  }

  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
  }

  // Chỉ tài khoản được đánh dấu app_metadata.role === "admin" (đặt qua Admin
  // API, không tự sửa được từ client) mới được vào trang quản trị — đăng
  // nhập đúng mật khẩu thôi chưa đủ.
  if (data.user.app_metadata?.role !== "admin") {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Tài khoản này không có quyền truy cập trang quản trị." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
