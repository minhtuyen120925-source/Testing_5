import "server-only";
import { GoogleGenAI, type Content, type FunctionDeclaration } from "@google/genai";
import { findScholarshipsBySchoolName } from "@/lib/supabase/scholarships";

const MODEL = "gemini-3.5-flash-lite";
const MAX_TOOL_ROUNDS = 5;

const lookupScholarshipsDeclaration: FunctionDeclaration = {
  name: "lookup_scholarships",
  description:
    "Tra cứu danh sách học bổng thật đang có tại một trường cụ thể, gồm tên học bổng, loại điều kiện (gpa hoặc ielts), giá trị điều kiện tối thiểu, và mức hỗ trợ.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      schoolName: {
        type: "string",
        description: "Tên trường cần tra cứu học bổng, ví dụ 'Đại học Deakin'.",
      },
    },
    required: ["schoolName"],
  },
};

const systemInstruction = `Bạn là trợ lý tư vấn học bổng của DuHoc24.

Bạn được cung cấp điểm học tập (GPA) và điểm IELTS tổng của một học viên, cùng danh sách các trường học viên ĐÃ ĐẠT điều kiện đầu vào (đã được hệ thống đối chiếu điểm chuẩn từ trước, không cần kiểm tra lại).

Nhiệm vụ: tìm và gợi ý học bổng phù hợp cho học viên trong số các trường đó.

QUY TẮC BẮT BUỘC:
- Dùng công cụ lookup_scholarships để tra cứu học bổng thật cho từng trường trong danh sách đã đạt mà học viên được cung cấp — tự quyết định cần tra cứu (những) trường nào, đừng bỏ sót trường nào trong danh sách.
- CHỈ được nhắc đến học bổng có trong kết quả tra cứu từ công cụ. Không tự bịa tên học bổng, điều kiện hay mức hỗ trợ.
- Tự so sánh GPA/IELTS của học viên với điều kiện tối thiểu (conditionType/conditionValue) của từng học bổng tra cứu được để quyết định học viên có đủ điều kiện học bổng đó hay không — đây là việc bạn tự đánh giá, không có sẵn đáp án đúng/sai.
- Với mỗi học bổng học viên đủ điều kiện: nêu rõ tên học bổng, trường, mức hỗ trợ.
- Nếu không có học bổng nào học viên đủ điều kiện, nói rõ điều đó; có thể nêu học bổng gần đạt nhất và còn thiếu bao nhiêu.
- Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt, dạng văn bản thuần (plain text) — không dùng cú pháp Markdown (không **, không #, không dấu * để in đậm), chỉ dùng gạch đầu dòng "-" và xuống dòng để trình bày danh sách.`;

function buildPrompt(gpa: number, ieltsOverall: number, passedSchools: string[]) {
  return `Thông tin học viên:
- Điểm học tập (GPA): ${gpa}
- Điểm IELTS tổng: ${ieltsOverall}

Danh sách trường học viên đã đạt điều kiện đầu vào:
${passedSchools.map((s) => `- ${s}`).join("\n")}

Hãy tra cứu và gợi ý học bổng phù hợp.`;
}

export async function recommendScholarships(
  gpa: number,
  ieltsOverall: number,
  passedSchools: string[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Thiếu GEMINI_API_KEY trên server.");

  const ai = new GoogleGenAI({ apiKey });

  const contents: Content[] = [
    { role: "user", parts: [{ text: buildPrompt(gpa, ieltsOverall, passedSchools) }] },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.2,
        tools: [{ functionDeclarations: [lookupScholarshipsDeclaration] }],
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      return response.text?.trim() || "Không tìm được gợi ý học bổng phù hợp.";
    }

    contents.push({ role: "model", parts: response.candidates?.[0]?.content?.parts ?? [] });

    const responseParts = [];
    for (const call of calls) {
      const schoolName = typeof call.args?.schoolName === "string" ? call.args.schoolName : "";
      const result = await findScholarshipsBySchoolName(schoolName);
      responseParts.push({
        functionResponse: {
          name: call.name,
          response: { result },
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return "Không tìm được gợi ý học bổng phù hợp sau nhiều lần tra cứu, bạn thử lại sau nhé.";
}
