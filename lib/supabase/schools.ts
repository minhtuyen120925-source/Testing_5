import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface SchoolRecord {
  id: string;
  name: string;
  country: string;
  minGpa: number;
  minIelts: number;
}

interface SchoolRow {
  id: string;
  name: string;
  country: string;
  min_gpa: number;
  min_ielts: number;
}

export async function listSchools(): Promise<SchoolRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, country, min_gpa, min_ielts")
    .order("country", { ascending: true })
    .order("name", { ascending: true })
    .returns<SchoolRow[]>();

  if (error) {
    console.error("Supabase list schools error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    country: row.country,
    minGpa: Number(row.min_gpa),
    minIelts: Number(row.min_ielts),
  }));
}
