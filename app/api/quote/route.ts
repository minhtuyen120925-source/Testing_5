import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ServicePackage } from "@/lib/mock-data";

// Bảng giá chính thức — nguồn duy nhất để tính báo giá, không tin vào giá trị
// (nếu có) mà trình duyệt gửi lên.
const PRICE_TABLE: Record<ServicePackage, number> = {
  co_ban: 15_000_000,
  toan_dien: 30_000_000,
};

const DEGREE_LEVELS = ["thpt", "dai_hoc", "thac_si"] as const;

interface QuoteRequestBody {
  country: string;
  degreeLevel: string;
  package: string;
  email: string;
  phone: string;
}

export async function POST(request: Request) {
  let body: QuoteRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const country = body.country?.trim();
  const degreeLevel = body.degreeLevel?.trim();
  const packageId = body.package?.trim() as ServicePackage;
  const email = body.email?.trim();
  const phone = body.phone?.trim();

  if (!country || !email || !phone) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
  }
  if (!DEGREE_LEVELS.includes(degreeLevel as (typeof DEGREE_LEVELS)[number])) {
    return NextResponse.json({ error: "Bậc học không hợp lệ." }, { status: 400 });
  }
  if (!(packageId in PRICE_TABLE)) {
    return NextResponse.json({ error: "Gói dịch vụ không hợp lệ." }, { status: 400 });
  }

  const price = PRICE_TABLE[packageId];
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      country,
      degree_level: degreeLevel,
      package: packageId,
      price,
      email,
      phone,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Supabase create quote request error:", error);
    return NextResponse.json(
      { error: "Không lưu được yêu cầu báo giá, bạn thử lại sau nhé." },
      { status: 500 },
    );
  }

  return NextResponse.json({ requestId: data.id, price });
}
