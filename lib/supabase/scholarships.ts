import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ScholarshipRecord {
  name: string;
  conditionType: "gpa" | "ielts";
  conditionValue: number;
  supportLevel: string;
}

interface ScholarshipRow {
  name: string;
  condition_type: "gpa" | "ielts";
  condition_value: number;
  support_level: string;
}

export interface SchoolScholarshipLookup {
  schoolName: string;
  found: boolean;
  scholarships: ScholarshipRecord[];
}

// Tra cứu học bổng thật theo tên trường — dùng làm cài đặt cho function
// calling của Gemini. Chỉ trả về dữ liệu thô (không tự tính đủ/thiếu điều
// kiện), để chính AI so sánh và quyết định, đúng yêu cầu không viết cứng
// luật so sánh trong code.
export async function findScholarshipsBySchoolName(schoolName: string): Promise<SchoolScholarshipLookup> {
  const supabase = createSupabaseServerClient();

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .ilike("name", schoolName.trim())
    .maybeSingle();

  if (schoolError || !school) {
    return { schoolName, found: false, scholarships: [] };
  }

  const { data, error } = await supabase
    .from("scholarships")
    .select("name, condition_type, condition_value, support_level")
    .eq("school_id", school.id)
    .returns<ScholarshipRow[]>();

  if (error) {
    console.error("Supabase find scholarships error:", error);
    return { schoolName: school.name, found: true, scholarships: [] };
  }

  return {
    schoolName: school.name,
    found: true,
    scholarships: (data ?? []).map((row) => ({
      name: row.name,
      conditionType: row.condition_type,
      conditionValue: Number(row.condition_value),
      supportLevel: row.support_level,
    })),
  };
}
