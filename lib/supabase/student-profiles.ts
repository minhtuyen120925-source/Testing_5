import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocType, ExtractedFields } from "@/lib/gemini/extract-document";

export interface StoredDocument {
  fileName: string;
  status: "hop_le" | "can_nop_lai";
  reason?: string;
  extracted: ExtractedFields;
  updatedAt: string;
}

export type ProfileDocuments = Record<DocType, StoredDocument | null>;

interface StudentDocumentRow {
  doc_type: DocType;
  file_name: string;
  status: "hop_le" | "can_nop_lai";
  reason: string | null;
  extracted: ExtractedFields;
  updated_at: string;
}

// Tất cả hàm dưới đây nhận sẵn một Supabase client thay vì tự tạo — để nơi
// gọi quyết định dùng client nào. Với hồ sơ học viên, luôn phải truyền
// client gắn phiên đăng nhập (createSupabaseAuthServerClient) để RLS thực
// sự có hiệu lực: mỗi người dùng chỉ đọc/ghi được đúng hồ sơ của chính
// mình (user_id = auth.uid()), không phải client dùng secret key (bỏ qua RLS).

export async function getOrCreateProfileForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    console.error("Supabase find student profile error:", findError);
    throw new Error("Không đọc được hồ sơ học viên.");
  }
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("student_profiles")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("Supabase create student profile error:", createError);
    throw new Error("Không tạo được hồ sơ học viên.");
  }

  return created.id;
}

export async function getProfileDocuments(
  supabase: SupabaseClient,
  profileId: string,
): Promise<ProfileDocuments> {
  const { data, error } = await supabase
    .from("student_documents")
    .select("doc_type, file_name, status, reason, extracted, updated_at")
    .eq("profile_id", profileId)
    .returns<StudentDocumentRow[]>();

  const result: ProfileDocuments = { transcript: null, ielts: null, identity: null };

  if (error) {
    console.error("Supabase get profile documents error:", error);
    return result;
  }

  for (const row of data ?? []) {
    result[row.doc_type] = {
      fileName: row.file_name,
      status: row.status,
      reason: row.reason ?? undefined,
      extracted: row.extracted,
      updatedAt: row.updated_at,
    };
  }

  return result;
}

export async function upsertStudentDocument(
  supabase: SupabaseClient,
  profileId: string,
  docType: DocType,
  doc: { fileName: string; status: "hop_le" | "can_nop_lai"; reason?: string; extracted: ExtractedFields },
): Promise<void> {
  const { error } = await supabase.from("student_documents").upsert(
    {
      profile_id: profileId,
      doc_type: docType,
      file_name: doc.fileName,
      status: doc.status,
      reason: doc.reason ?? null,
      extracted: doc.extracted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,doc_type" },
  );

  if (error) {
    console.error("Supabase upsert student document error:", error);
    throw new Error("Không lưu được giấy tờ.");
  }
}
