"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScholarshipAdvisor({
  gpa,
  ieltsOverall,
  passedSchools,
}: {
  gpa: number;
  ieltsOverall: number;
  passedSchools: string[];
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recommendation, setRecommendation] = React.useState<string | null>(null);

  async function handleFind() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portal/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gpa, ieltsOverall, passedSchools }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra, bạn thử lại nhé.");
        return;
      }
      setRecommendation(data.recommendation);
    } catch {
      setError("Không kết nối được máy chủ, bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gợi ý học bổng</CardTitle>
        <p className="text-sm text-muted-foreground">
          AI sẽ tra cứu học bổng thật tại các trường bạn đã đạt điều kiện và gợi ý học bổng phù hợp với hồ sơ của bạn.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button type="button" onClick={handleFind} disabled={loading}>
          <Sparkles className="size-4" />
          {loading ? "Đang tìm học bổng..." : recommendation ? "Tìm lại" : "Tìm học bổng phù hợp"}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {recommendation && (
          <div className="whitespace-pre-line rounded-xl bg-muted/40 p-4 text-sm text-foreground">
            {recommendation}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
