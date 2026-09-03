import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RequestStatus, ServicePackage } from "@/lib/mock-data";

export interface QuoteRequest {
  id: string;
  country: string;
  degreeLevel: string;
  package: ServicePackage;
  price: number;
  email: string;
  phone: string;
  status: RequestStatus;
  createdAt: string;
}

interface QuoteRequestRow {
  id: string;
  country: string;
  degree_level: string;
  package: ServicePackage;
  price: number;
  email: string;
  phone: string;
  status: RequestStatus;
  created_at: string;
}

export async function listQuoteRequests(): Promise<QuoteRequest[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, country, degree_level, package, price, email, phone, status, created_at")
    .order("created_at", { ascending: false })
    .returns<QuoteRequestRow[]>();

  if (error) {
    console.error("Supabase list quote requests error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    country: row.country,
    degreeLevel: row.degree_level,
    package: row.package,
    price: row.price,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function updateQuoteRequestStatus(id: string, status: RequestStatus) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);

  if (error) {
    console.error("Supabase update quote request status error:", error);
    throw new Error("Không cập nhật được trạng thái yêu cầu.");
  }
}
