// Toàn bộ dữ liệu trong file này là dữ liệu giả (mock), viết cứng để dựng UI.
// Học viên sẽ thay thế bằng dữ liệu thật từ Supabase ở các tuần sau.

export type DocStatus = "chua_nop" | "dang_xu_ly" | "hop_le" | "can_nop_lai";

export type RequestStatus = "cho_duyet" | "da_duyet" | "tu_choi";

export type ServicePackage = "co_ban" | "toan_dien";

export const countries = [
  "Mỹ",
  "Anh",
  "Úc",
  "Canada",
  "Hàn Quốc",
  "Nhật Bản",
] as const;

export const degreeLevels = [
  { value: "thpt", label: "THPT" },
  { value: "dai_hoc", label: "Đại học" },
  { value: "thac_si", label: "Thạc sĩ" },
] as const;

export interface ServiceOption {
  id: ServicePackage;
  name: string;
  price: number;
  description: string;
  benefits: string[];
}

export const servicePackages: ServiceOption[] = [
  {
    id: "co_ban",
    name: "Cơ bản",
    price: 15_000_000,
    description: "Phù hợp nếu hồ sơ của bạn đơn giản và đã chuẩn bị sẵn phần lớn giấy tờ.",
    benefits: [
      "Đối chiếu điểm chuẩn tự động",
      "Kiểm tra hợp lệ giấy tờ (bảng điểm, IELTS, CMND/hộ chiếu)",
      "Hỗ trợ qua email trong 24h",
      "1 lần nộp lại hồ sơ miễn phí",
    ],
  },
  {
    id: "toan_dien",
    name: "Toàn diện",
    price: 30_000_000,
    description: "Đồng hành trọn gói từ tư vấn trường đến nộp hồ sơ.",
    benefits: [
      "Toàn bộ quyền lợi gói Cơ bản",
      "Tư vấn chọn trường 1:1 với chuyên viên",
      "Rà soát hồ sơ không giới hạn số lần",
      "Hỗ trợ ưu tiên qua điện thoại + email",
      "Theo dõi tiến độ xét duyệt hằng tuần",
    ],
  },
];

export interface StudentProfile {
  id: string;
  studentName: string;
  email: string;
  submittedAt: string;
  docs: {
    transcript: DocStatus;
    ielts: DocStatus;
    identity: DocStatus;
  };
  matchedSchools: number;
  totalSchools: number;
}

export const studentProfiles: StudentProfile[] = [
  {
    id: "stu_501",
    studentName: "Nguyễn Minh Anh",
    email: "minhanh.nguyen@example.com",
    submittedAt: "2026-08-01",
    docs: { transcript: "hop_le", ielts: "dang_xu_ly", identity: "can_nop_lai" },
    matchedSchools: 2,
    totalSchools: 5,
  },
  {
    id: "stu_502",
    studentName: "Vũ Thị Mai",
    email: "mai.vu@example.com",
    submittedAt: "2026-07-30",
    docs: { transcript: "hop_le", ielts: "hop_le", identity: "hop_le" },
    matchedSchools: 3,
    totalSchools: 5,
  },
  {
    id: "stu_503",
    studentName: "Hoàng Gia Bảo",
    email: "bao.hoang@example.com",
    submittedAt: "2026-08-02",
    docs: { transcript: "hop_le", ielts: "hop_le", identity: "dang_xu_ly" },
    matchedSchools: 1,
    totalSchools: 5,
  },
  {
    id: "stu_504",
    studentName: "Trịnh Thu Trang",
    email: "trang.trinh@example.com",
    submittedAt: "2026-08-04",
    docs: { transcript: "can_nop_lai", ielts: "hop_le", identity: "hop_le" },
    matchedSchools: 0,
    totalSchools: 5,
  },
  {
    id: "stu_505",
    studentName: "Bùi Anh Tuấn",
    email: "tuan.bui@example.com",
    submittedAt: "2026-08-05",
    docs: { transcript: "dang_xu_ly", ielts: "dang_xu_ly", identity: "dang_xu_ly" },
    matchedSchools: 0,
    totalSchools: 5,
  },
];

// Bộ câu hỏi & câu trả lời cho chatbot QnA (Tuần 2), dùng làm systemInstruction cho Gemini.
// Đây là phạm vi kiến thức DUY NHẤT mà chatbot được phép trả lời dựa trên.
export interface ChatbotQnaItem {
  question: string;
  answer: string;
}

export const chatbotQna: ChatbotQnaItem[] = [
  {
    question: "Dịch vụ này gồm những gì?",
    answer:
      "Có 2 gói: gói Cơ bản chỉ hỗ trợ chuẩn bị và nộp hồ sơ, gói Toàn diện thêm cả tư vấn xin học bổng và phỏng vấn.",
  },
  {
    question: "Mất bao lâu để có kết quả?",
    answer:
      "Sau khi nộp đủ hồ sơ, hệ thống đối chiếu và báo kết quả sơ bộ trong vài phút. Kết quả chính thức từ trường thường mất 2-6 tuần tùy trường.",
  },
  {
    question: "Cần chuẩn bị giấy tờ gì?",
    answer:
      "3 loại: bảng điểm học tập (định dạng PDF), ảnh chứng chỉ IELTS, và ảnh CMND/CCCD hoặc hộ chiếu.",
  },
  {
    question: "Chi phí dịch vụ là bao nhiêu?",
    answer:
      "Tùy gói và bậc học, xem báo giá ngay trên trang chủ sau khi điền form, không mất phí xem báo giá.",
  },
  {
    question: "Tôi chưa có bằng IELTS thì có đăng ký được không?",
    answer:
      "Vẫn đăng ký được, nhưng cần bổ sung chứng chỉ IELTS trước khi nộp hồ sơ chính thức cho trường.",
  },
  {
    question: "Làm sao biết mình đủ điều kiện vào trường nào?",
    answer:
      "Sau khi nộp đủ hồ sơ trong cổng hồ sơ, hệ thống tự so sánh điểm học tập và điểm IELTS với điểm chuẩn từng trường, báo ngay trường nào đủ điều kiện.",
  },
  {
    question: "Sau khi điền form báo giá, bước tiếp theo là gì?",
    answer:
      "Đội ngũ tư vấn sẽ xem xét và duyệt yêu cầu, sau đó gửi email mời bạn vào cổng hồ sơ để nộp giấy tờ.",
  },
  {
    question: "Hồ sơ của tôi có được bảo mật không?",
    answer:
      "Có, hồ sơ chỉ hiển thị cho bạn và đội ngũ tư vấn sau khi đăng nhập, không công khai.",
  },
  {
    question: "Tôi cần liên hệ ai nếu có thắc mắc khác?",
    answer:
      "Bạn có thể để lại câu hỏi ngay trong khung chat này, hoặc để lại email/số điện thoại trong form báo giá, đội ngũ sẽ liên hệ lại.",
  },
];
