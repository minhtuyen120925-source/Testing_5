import { cookies } from "next/headers";
import { LogOut } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { PortalClient } from "@/components/portal/portal-client";
import { PROFILE_COOKIE_NAME } from "@/lib/portal";
import { getProfileDocuments, type ProfileDocuments } from "@/lib/supabase/student-profiles";
import { listSchools } from "@/lib/supabase/schools";

const EMPTY_DOCUMENTS: ProfileDocuments = { transcript: null, ielts: null, identity: null };

// Hồ sơ gắn với cookie riêng của từng khách — luôn lấy mới mỗi lần vào
// trang, không để Next.js đóng băng thành trang tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(PROFILE_COOKIE_NAME)?.value;

  const [documents, schools] = await Promise.all([
    profileId ? getProfileDocuments(profileId) : Promise.resolve(EMPTY_DOCUMENTS),
    listSchools(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-sm text-muted-foreground">Cổng hồ sơ học viên</p>
            <h1 className="text-2xl font-medium tracking-tight">Nộp giấy tờ &amp; đối chiếu điểm chuẩn</h1>
          </div>
          <Button variant="outline">
            <LogOut className="size-4" />
            Đăng xuất
          </Button>
        </div>

        <PortalClient initialDocuments={documents} schools={schools} />
      </main>
    </>
  );
}
