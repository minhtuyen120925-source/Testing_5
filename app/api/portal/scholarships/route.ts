import { NextResponse } from "next/server";
import { recommendScholarships } from "@/lib/gemini/scholarship-advisor";

interface ScholarshipRequestBody {
  gpa: number;
  ieltsOverall: number;
  passedSchools: string[];
}

export async function POST(request: Request) {
  let body: ScholarshipRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const gpa = Number(body.gpa);
  const ieltsOverall = Number(body.ieltsOverall);
  const passedSchools = Array.isArray(body.passedSchools)
    ? body.passedSchools.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    : [];

  if (!Number.isFinite(gpa) || !Number.isFinite(ieltsOverall) || passedSchools.length === 0) {
    return NextResponse.json({ error: "Thiếu thông tin để gợi ý học bổng." }, { status: 400 });
  }

  try {
    const recommendation = await recommendScholarships(gpa, ieltsOverall, passedSchools);
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Scholarship recommendation error:", error);
    return NextResponse.json(
      { error: "Không gợi ý được học bổng lúc này, bạn thử lại sau nhé." },
      { status: 500 },
    );
  }
}
