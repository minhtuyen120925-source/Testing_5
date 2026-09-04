import "server-only";
import { GoogleGenAI, Type, type Schema } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";

export type DocType = "transcript" | "ielts" | "identity";

export interface ExtractedFields {
  [key: string]: string | number;
}

export interface ExtractResult {
  status: "hop_le" | "can_nop_lai";
  reason?: string;
  extracted: ExtractedFields;
}

interface DocConfig {
  label: string;
  acceptedMimeTypes: string[];
  maxBytes: number;
  prompt: string;
  schema: Schema;
  validate: (data: ExtractedFields) => string | null;
}

const COMMON_INSTRUCTION =
  'Nếu không tìm thấy hoặc không đọc rõ một trường nào, trả về chuỗi rỗng "" cho trường dạng chữ, hoặc 0 cho trường dạng số. Không suy đoán hay bịa số liệu.';

export const DOC_CONFIG: Record<DocType, DocConfig> = {
  transcript: {
    label: "bảng điểm học tập",
    acceptedMimeTypes: ["application/pdf"],
    maxBytes: 4 * 1024 * 1024,
    prompt: `Đây là bảng điểm học tập (PDF) của một học viên. Đọc kỹ và trích xuất chính xác:
- fullName: họ tên đầy đủ của học viên ghi trên bảng điểm
- dateOfBirth: ngày sinh của học viên (giữ nguyên định dạng ghi trên bảng điểm)
- gpa: điểm học tập tổng kết / điểm trung bình tích lũy (chỉ lấy số, ví dụ 8.4)

${COMMON_INSTRUCTION}`,
    schema: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        dateOfBirth: { type: Type.STRING },
        gpa: { type: Type.NUMBER },
      },
      required: ["fullName", "dateOfBirth", "gpa"],
    },
    validate: (d) => {
      if (!d.fullName) return "Không đọc được họ tên trên bảng điểm.";
      if (!d.dateOfBirth) return "Không đọc được ngày sinh trên bảng điểm.";
      const gpa = Number(d.gpa);
      if (!(gpa > 0 && gpa <= 10)) return "Không đọc được điểm học tập hợp lệ (thang 0-10).";
      return null;
    },
  },
  ielts: {
    label: "chứng chỉ IELTS",
    acceptedMimeTypes: ["image/jpeg", "image/png"],
    maxBytes: 4 * 1024 * 1024,
    prompt: `Đây là ảnh chứng chỉ IELTS của một học viên. Đọc kỹ và trích xuất chính xác:
- fullName: họ tên đầy đủ ghi trên chứng chỉ
- listening, reading, writing, speaking: điểm từng kỹ năng Nghe, Đọc, Viết, Nói (chỉ lấy số, ví dụ 6.5)
- overall: điểm tổng (Overall Band Score)
- examDate: ngày thi (giữ nguyên định dạng ghi trên chứng chỉ)

${COMMON_INSTRUCTION}`,
    schema: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        listening: { type: Type.NUMBER },
        reading: { type: Type.NUMBER },
        writing: { type: Type.NUMBER },
        speaking: { type: Type.NUMBER },
        overall: { type: Type.NUMBER },
        examDate: { type: Type.STRING },
      },
      required: ["fullName", "listening", "reading", "writing", "speaking", "overall", "examDate"],
    },
    validate: (d) => {
      if (!d.fullName) return "Không đọc được họ tên trên chứng chỉ IELTS.";
      const bands = [d.listening, d.reading, d.writing, d.speaking, d.overall].map(Number);
      if (bands.some((b) => !(b >= 0 && b <= 9))) return "Không đọc được điểm IELTS hợp lệ (thang 0-9).";
      if (!d.examDate) return "Không đọc được ngày thi trên chứng chỉ.";
      return null;
    },
  },
  identity: {
    label: "CMND/CCCD hoặc hộ chiếu",
    acceptedMimeTypes: ["image/jpeg", "image/png"],
    maxBytes: 4 * 1024 * 1024,
    prompt: `Đây là ảnh CMND/CCCD hoặc hộ chiếu của một học viên. Đọc kỹ và trích xuất chính xác:
- fullName: họ tên đầy đủ ghi trên giấy tờ
- dateOfBirth: ngày sinh (giữ nguyên định dạng ghi trên giấy tờ)
- idNumber: số CMND/CCCD hoặc số hộ chiếu

${COMMON_INSTRUCTION}`,
    schema: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        dateOfBirth: { type: Type.STRING },
        idNumber: { type: Type.STRING },
      },
      required: ["fullName", "dateOfBirth", "idNumber"],
    },
    validate: (d) => {
      if (!d.fullName) return "Không đọc được họ tên trên giấy tờ.";
      if (!d.dateOfBirth) return "Không đọc được ngày sinh trên giấy tờ.";
      if (!d.idNumber) return "Không đọc được số giấy tờ.";
      return null;
    },
  },
};

export async function extractDocument(
  docType: DocType,
  base64: string,
  mimeType: string,
): Promise<ExtractResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const config = DOC_CONFIG[docType];

  if (!apiKey) {
    throw new Error("Thiếu GEMINI_API_KEY trên server.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType, data: base64 } }, { text: config.prompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: config.schema,
        temperature: 0.1,
      },
    });

    const extracted = JSON.parse(response.text ?? "{}") as ExtractedFields;
    const reason = config.validate(extracted);

    return {
      status: reason ? "can_nop_lai" : "hop_le",
      reason: reason ?? undefined,
      extracted,
    };
  } catch (error) {
    console.error(`Gemini extract ${docType} error:`, error);
    return {
      status: "can_nop_lai",
      reason: "Không đọc được file, bạn thử chụp/scan lại rõ nét hơn nhé.",
      extracted: {},
    };
  }
}
