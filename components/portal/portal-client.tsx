"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FileText, IdCard, Loader2, Medal, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DocStatusBadge } from "@/components/status-badge";
import { ExtractedInfo } from "@/components/portal/extracted-info";
import { SchoolMatch } from "@/components/portal/school-match";
import { ScholarshipAdvisor } from "@/components/portal/scholarship-advisor";
import type { DocStatus } from "@/lib/mock-data";
import type { DocType, ExtractedFields } from "@/lib/gemini/extract-document";
import type { ProfileDocuments, StoredDocument } from "@/lib/supabase/student-profiles";
import type { SchoolRecord } from "@/lib/supabase/schools";

interface SlotConfig {
  docType: DocType;
  title: string;
  icon: LucideIcon;
  accept: string;
  inputAccept: string;
}

const SLOTS: SlotConfig[] = [
  {
    docType: "transcript",
    title: "Bảng điểm (PDF)",
    icon: FileText,
    accept: "Chấp nhận PDF",
    inputAccept: "application/pdf",
  },
  {
    docType: "ielts",
    title: "Ảnh chứng chỉ IELTS",
    icon: Medal,
    accept: "Chấp nhận JPG, PNG",
    inputAccept: "image/jpeg,image/png",
  },
  {
    docType: "identity",
    title: "Ảnh CMND/CCCD hoặc hộ chiếu",
    icon: IdCard,
    accept: "Chấp nhận JPG, PNG",
    inputAccept: "image/jpeg,image/png",
  },
];

interface SlotState {
  fileName: string | null;
  status: DocStatus;
  reason?: string;
  extracted?: ExtractedFields;
}

function toSlotState(stored: StoredDocument | null): SlotState {
  if (!stored) return { fileName: null, status: "chua_nop" };
  return {
    fileName: stored.fileName,
    status: stored.status,
    reason: stored.reason,
    extracted: stored.extracted,
  };
}

interface DocIssue {
  docType: DocType;
  title: string;
  kind: "missing" | "invalid";
  reason?: string;
}

// Kiểm tra hoàn toàn bằng code dựa trên trạng thái đã có sẵn của từng giấy
// tờ — không gọi lại AI. "missing" = chưa nộp, "invalid" = đã nộp nhưng
// không đọc được đủ thông tin cần thiết (lý do cụ thể đến từ bước validate
// khi trích xuất).
function getDocIssues(slots: Record<DocType, SlotState>): DocIssue[] {
  return SLOTS.flatMap((slot): DocIssue[] => {
    const state = slots[slot.docType];
    if (state.status === "chua_nop") {
      return [{ docType: slot.docType, title: slot.title, kind: "missing" }];
    }
    if (state.status === "can_nop_lai") {
      return [{ docType: slot.docType, title: slot.title, kind: "invalid", reason: state.reason }];
    }
    return [];
  });
}

export function PortalClient({
  initialDocuments,
  schools,
}: {
  initialDocuments: ProfileDocuments;
  schools: SchoolRecord[];
}) {
  const [slots, setSlots] = React.useState<Record<DocType, SlotState>>({
    transcript: toSlotState(initialDocuments.transcript),
    ielts: toSlotState(initialDocuments.ielts),
    identity: toSlotState(initialDocuments.identity),
  });

  const inputRefs = React.useRef<Partial<Record<DocType, HTMLInputElement | null>>>({});

  async function handleUpload(docType: DocType, file: File) {
    setSlots((prev) => ({ ...prev, [docType]: { fileName: file.name, status: "dang_xu_ly" } }));

    try {
      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("file", file);
      const res = await fetch("/api/portal/documents", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setSlots((prev) => ({
          ...prev,
          [docType]: {
            fileName: file.name,
            status: "can_nop_lai",
            reason: data.error ?? "Có lỗi xảy ra, bạn thử lại nhé.",
          },
        }));
        return;
      }

      setSlots((prev) => ({
        ...prev,
        [docType]: {
          fileName: data.fileName,
          status: data.status,
          reason: data.reason ?? undefined,
          extracted: data.extracted,
        },
      }));
    } catch {
      setSlots((prev) => ({
        ...prev,
        [docType]: {
          fileName: file.name,
          status: "can_nop_lai",
          reason: "Không kết nối được máy chủ, bạn thử lại nhé.",
        },
      }));
    }
  }

  const transcript = slots.transcript.status === "hop_le" ? slots.transcript.extracted : undefined;
  const ielts = slots.ielts.status === "hop_le" ? slots.ielts.extracted : undefined;
  const identity = slots.identity.status === "hop_le" ? slots.identity.extracted : undefined;

  const gpa = transcript ? Number(transcript.gpa) : null;
  const ieltsOverall = ielts ? Number(ielts.overall) : null;
  const matchInput = gpa !== null && ieltsOverall !== null ? { gpa, ieltsOverall } : null;
  const matches = matchInput
    ? schools.map((school) => ({
        school,
        passed: matchInput.gpa >= school.minGpa && matchInput.ieltsOverall >= school.minIelts,
      }))
    : null;
  const passedSchools = matches?.filter((m) => m.passed).map((m) => m.school.name) ?? [];

  const issues = getDocIssues(slots);
  const matchBlockers = issues.filter((i) => i.docType === "transcript" || i.docType === "ielts");

  return (
    <>
      <section className="mt-10">
        <h2 className="text-lg font-medium">Giấy tờ cần nộp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nộp đủ 3 loại giấy tờ dưới đây, hệ thống sẽ tự trích xuất thông tin và đối chiếu điểm chuẩn giúp bạn.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {SLOTS.map((slot) => {
            const state = slots[slot.docType];
            const uploading = state.status === "dang_xu_ly";
            return (
              <div key={slot.docType}>
                <Card className="flex aspect-video flex-col items-center justify-center gap-2 border-none bg-foreground/5 p-6 shadow-none ring-0">
                  {uploading ? (
                    <Loader2 className="size-7 animate-spin text-muted-foreground" />
                  ) : (
                    <slot.icon className="size-7 text-muted-foreground" />
                  )}
                  <span className="max-w-full truncate px-4 text-xs text-muted-foreground">
                    {state.fileName ?? "Chưa chọn file"}
                  </span>
                </Card>

                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{slot.title}</h3>
                    {state.status !== "chua_nop" && <DocStatusBadge status={state.status} />}
                  </div>
                  <p className="mt-3 text-balance text-muted-foreground">
                    {state.status === "can_nop_lai" && state.reason ? (
                      <>
                        Cần nộp lại: <span className="text-red-600">{state.reason}</span>
                      </>
                    ) : (
                      slot.accept
                    )}
                  </p>

                  <input
                    ref={(el) => {
                      inputRefs.current[slot.docType] = el;
                    }}
                    type="file"
                    accept={slot.inputAccept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) handleUpload(slot.docType, file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    disabled={uploading}
                    onClick={() => inputRefs.current[slot.docType]?.click()}
                  >
                    <Upload className="size-3.5" />
                    {state.fileName ? "Tải lên file khác" : "Chọn file"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {issues.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4 shrink-0" />
              Hồ sơ chưa đầy đủ
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {issues.map((issue) => (
                <li key={issue.docType}>
                  {issue.kind === "missing" ? (
                    <>
                      Chưa nộp <strong>{issue.title}</strong>.
                    </>
                  ) : (
                    <>
                      <strong>{issue.title}</strong> cần nộp lại: {issue.reason}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-12 space-y-6">
        <ExtractedInfo transcript={transcript} ielts={ielts} identity={identity} />
        {matches && matchInput ? (
          <>
            <SchoolMatch matches={matches} />
            {passedSchools.length > 0 && (
              <ScholarshipAdvisor
                gpa={matchInput.gpa}
                ieltsOverall={matchInput.ieltsOverall}
                passedSchools={passedSchools}
              />
            )}
          </>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">
            Chưa thể đối chiếu điểm chuẩn — xem mục &quot;Hồ sơ chưa đầy đủ&quot; ở trên để biết cần nộp
            hoặc nộp lại giấy tờ nào ({matchBlockers.map((i) => i.title.toLowerCase()).join(", ")}).
          </Card>
        )}
      </section>
    </>
  );
}
