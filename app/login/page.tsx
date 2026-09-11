"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGE = "Không gửi được link đăng nhập, bạn thử lại sau nhé.";
const EXPIRED_LINK_MESSAGE = "Link đăng nhập không hợp lệ hoặc đã hết hạn, bạn gửi lại link mới nhé.";

function LoginForm() {
  const searchParams = useSearchParams();
  const hadCallbackError = searchParams.get("error") === "1";

  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(hadCallbackError ? EXPIRED_LINK_MESSAGE : null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? ERROR_MESSAGE);
        return;
      }
      setSentTo(email);
    } catch {
      setError(ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-8 p-6">
      {sentTo ? (
        <div className="flex items-start gap-3 text-sm">
          <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">Kiểm tra email của bạn</p>
            <p className="mt-1 text-muted-foreground">
              Mình đã gửi link đăng nhập tới <strong className="text-foreground">{sentTo}</strong>. Bấm vào
              link trong email để vào cổng hồ sơ.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="ban@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi link đăng nhập"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-1px)] max-w-md flex-col justify-center px-6 py-32">
        <h1 className="text-balance text-3xl font-medium tracking-tight md:text-4xl">
          Đăng nhập cổng hồ sơ
        </h1>
        <p className="mt-3 text-muted-foreground">
          Nhập email để nhận link đăng nhập, không cần mật khẩu.
        </p>

        <React.Suspense fallback={<Card className="mt-8 h-40 animate-pulse p-6" />}>
          <LoginForm />
        </React.Suspense>
      </main>
    </>
  );
}
