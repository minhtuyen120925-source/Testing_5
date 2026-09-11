import "server-only";

interface NewQuoteRequestPayload {
  requestId: string;
  customerName: string;
  email: string;
  package: string;
  price: number;
}

// Báo cho kịch bản Make.com biết có yêu cầu báo giá mới (Tuần 5: tự động
// hoá). Lỗi ở đây không được làm hỏng phản hồi báo giá cho khách — chỉ log
// lại để kiểm tra sau.
export async function notifyNewQuoteRequest(payload: NewQuoteRequestPayload): Promise<void> {
  const webhookUrl = process.env.MAKE_QUOTE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("MAKE_QUOTE_WEBHOOK_URL chưa được cấu hình, bỏ qua thông báo webhook.");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Make.com webhook trả về lỗi ${res.status}:`, await res.text());
    }
  } catch (error) {
    console.error("Không gọi được Make.com webhook:", error);
  }
}
