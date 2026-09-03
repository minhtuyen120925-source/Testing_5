import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client server-only, dùng SUPABASE_SECRET_KEY (bypass RLS). Import "server-only"
// khiến build lỗi ngay nếu file này lỡ bị kéo vào bundle phía trình duyệt —
// dữ liệu hội thoại của khách chỉ được đọc/ghi từ server, không bao giờ lộ ra client.
export function createSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trên server.");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}
