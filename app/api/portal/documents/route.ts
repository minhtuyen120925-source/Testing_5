import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DOC_CONFIG, extractDocument, type DocType } from "@/lib/gemini/extract-document";
import { createProfile, profileExists, upsertStudentDocument } from "@/lib/supabase/student-profiles";
import { PROFILE_COOKIE_NAME } from "@/lib/portal";

const DOC_TYPES: DocType[] = ["transcript", "ielts", "identity"];

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const docType = formData.get("docType");
  const file = formData.get("file");

  if (typeof docType !== "string" || !DOC_TYPES.includes(docType as DocType)) {
    return NextResponse.json({ error: "Loại giấy tờ không hợp lệ." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Thiếu file." }, { status: 400 });
  }

  const config = DOC_CONFIG[docType as DocType];

  if (!config.acceptedMimeTypes.includes(file.type)) {
    return NextResponse.json(
      { error: `Sai định dạng file cho ${config.label}. Chỉ chấp nhận: ${config.acceptedMimeTypes.join(", ")}.` },
      { status: 400 },
    );
  }
  if (file.size > config.maxBytes) {
    return NextResponse.json(
      { error: `File quá lớn, tối đa ${Math.round(config.maxBytes / (1024 * 1024))}MB.` },
      { status: 400 },
    );
  }

  let profileId: string;
  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get(PROFILE_COOKIE_NAME)?.value;
    profileId = existing && (await profileExists(existing)) ? existing : await createProfile();
  } catch (error) {
    console.error("Portal upload: resolve profile error:", error);
    return NextResponse.json(
      { error: "Không kết nối được máy chủ, bạn thử lại sau nhé." },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const result = await extractDocument(docType as DocType, base64, file.type);

  try {
    await upsertStudentDocument(profileId, docType as DocType, {
      fileName: file.name,
      status: result.status,
      reason: result.reason,
      extracted: result.extracted,
    });
  } catch (error) {
    console.error("Portal upload: save document error:", error);
    return NextResponse.json(
      { error: "Không lưu được giấy tờ, bạn thử lại sau nhé." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    docType,
    fileName: file.name,
    status: result.status,
    reason: result.reason ?? null,
    extracted: result.extracted,
  });

  response.cookies.set(PROFILE_COOKIE_NAME, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });

  return response;
}
