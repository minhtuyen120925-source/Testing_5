import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

export async function createProfile(): Promise<string> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_profiles")
    .insert({})
    .select("id")
    .single();

  if (error || !data) {
    console.error("Supabase create student profile error:", error);
    throw new Error("Không tạo được hồ sơ học viên.");
  }

  return data.id;
}

export async function profileExists(profileId: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();
  return !!data;
}

export async function getProfileDocuments(profileId: string): Promise<ProfileDocuments> {
  const supabase = createSupabaseServerClient();
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
  profileId: string,
  docType: DocType,
  doc: { fileName: string; status: "hop_le" | "can_nop_lai"; reason?: string; extracted: ExtractedFields },
): Promise<void> {
  const supabase = createSupabaseServerClient();
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
