import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExtractedFields } from "@/lib/gemini/extract-document";

interface DocSection {
  title: string;
  fields: { label: string; value: string }[];
}

function toFixed1(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : String(value ?? "");
}

function buildSections(
  transcript?: ExtractedFields,
  ielts?: ExtractedFields,
  identity?: ExtractedFields,
): DocSection[] {
  const sections: DocSection[] = [];

  if (transcript) {
    sections.push({
      title: "Bảng điểm học tập",
      fields: [
        { label: "Họ tên", value: String(transcript.fullName) },
        { label: "Ngày sinh", value: String(transcript.dateOfBirth) },
        { label: "Điểm học tập (GPA)", value: toFixed1(transcript.gpa) },
      ],
    });
  }

  if (ielts) {
    sections.push({
      title: "Chứng chỉ IELTS",
      fields: [
        { label: "Họ tên trên chứng chỉ", value: String(ielts.fullName) },
        { label: "Nghe (Listening)", value: toFixed1(ielts.listening) },
        { label: "Đọc (Reading)", value: toFixed1(ielts.reading) },
        { label: "Viết (Writing)", value: toFixed1(ielts.writing) },
        { label: "Nói (Speaking)", value: toFixed1(ielts.speaking) },
        { label: "Điểm tổng (Overall)", value: toFixed1(ielts.overall) },
        { label: "Ngày thi", value: String(ielts.examDate) },
      ],
    });
  }

  if (identity) {
    sections.push({
      title: "CMND/CCCD/Hộ chiếu",
      fields: [
        { label: "Họ tên", value: String(identity.fullName) },
        { label: "Ngày sinh", value: String(identity.dateOfBirth) },
        { label: "Số giấy tờ", value: String(identity.idNumber) },
      ],
    });
  }

  return sections;
}

export function ExtractedInfo({
  transcript,
  ielts,
  identity,
}: {
  transcript?: ExtractedFields;
  ielts?: ExtractedFields;
  identity?: ExtractedFields;
}) {
  const sections = buildSections(transcript, ielts, identity);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin đã trích xuất</CardTitle>
        <p className="text-sm text-muted-foreground">
          Đây là thông tin đọc được từ giấy tờ bạn đã nộp, kiểm tra lại xem có đúng không nhé.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nộp giấy tờ hợp lệ để xem thông tin trích xuất tại đây.
          </p>
        ) : (
          sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-medium text-foreground">{section.title}</h4>
              <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <div key={field.label} className="rounded-lg bg-muted/40 p-3">
                    <dt className="text-xs text-muted-foreground">{field.label}</dt>
                    <dd className="mt-1 text-base font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
