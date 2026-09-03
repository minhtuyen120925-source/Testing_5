import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getConversation } from "@/lib/supabase/conversations";
import { cn, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminConversationDetailPage({
  params,
}: PageProps<"/admin/conversations/[id]">) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) notFound();

  return (
    <>
      <AdminPageHeader
        title={`Hội thoại · ${conversation.channel}`}
        description={`Bắt đầu lúc ${formatDateTime(conversation.startedAt)} · ${conversation.messages.length} tin nhắn`}
        action={
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/conversations" />}
          >
            <ArrowLeft />
            Quay lại danh sách
          </Button>
        }
      />

      <Card className="p-6">
        {conversation.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cuộc hội thoại này chưa có tin nhắn nào.</p>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.sender === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] space-y-1",
                    m.sender === "user" ? "items-end text-right" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line",
                      m.sender === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                  <p className="px-1 text-xs text-muted-foreground">
                    {m.sender === "user" ? "Khách" : "Chatbot"} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
