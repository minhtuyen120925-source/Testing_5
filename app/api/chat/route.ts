import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { chatbotQna } from "@/lib/mock-data";

const MODEL = "gemini-3.5-flash-lite";

const FALLBACK_ANSWER =
  "Xin lỗi, mình chưa có thông tin về câu hỏi này. Bạn để lại câu hỏi hoặc email/số điện thoại trong form báo giá, đội ngũ tư vấn sẽ liên hệ lại nhé.";

const systemInstruction = `Bạn là trợ lý tư vấn du học của DuHoc24, trả lời bằng tiếng Việt, ngắn gọn, thân thiện, xưng "mình".

QUY TẮC BẮT BUỘC:
- Chỉ được trả lời dựa trên ĐÚNG nội dung bộ câu hỏi & câu trả lời dưới đây. Có thể diễn đạt lại cho tự nhiên, nhưng không được thêm bất kỳ thông tin, số liệu hay cam kết nào ngoài phạm vi này.
- Nếu câu hỏi của người dùng không khớp với bộ câu hỏi & câu trả lời dưới đây (kể cả hỏi về chủ đề khác hoàn toàn), hãy trả lời chính xác: "${FALLBACK_ANSWER}"
- Không suy đoán, không bịa thêm chi tiết.
- Dùng lịch sử hội thoại phía trên để hiểu ngữ cảnh của câu hỏi hiện tại (ví dụ hiểu "gói đó", "cái đó", "vậy còn..." đang nhắc tới điều gì đã nói trước đó), nhưng nội dung câu trả lời vẫn phải nằm đúng trong bộ câu hỏi & câu trả lời ở trên.

BỘ CÂU HỎI & CÂU TRẢ LỜI:
${chatbotQna.map((qa) => `Hỏi: ${qa.question}\nĐáp: ${qa.answer}`).join("\n\n")}`;

interface ChatRequestBody {
  message: string;
  history?: { from: "bot" | "user"; text: string }[];
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Thiếu GEMINI_API_KEY trên server." },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Thiếu message." }, { status: 400 });
  }

  const history = (body.history ?? []).map((m) => ({
    role: m.from === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.text }],
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      config: { systemInstruction, temperature: 0.2 },
      contents: [...history, { role: "user", parts: [{ text: message }] }],
    });

    const reply = response.text?.trim() || FALLBACK_ANSWER;
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return NextResponse.json(
      { error: "Xin lỗi, hệ thống đang gặp sự cố, bạn thử lại sau nhé." },
      { status: 502 },
    );
  }
}
