import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { LogoutButton } from "@/components/portal/logout-button";
import { PortalClient } from "@/components/portal/portal-client";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getOrCreateProfileForUser, getProfileDocuments } from "@/lib/supabase/student-profiles";
import { listSchools } from "@/lib/supabase/schools";

// Hồ sơ gắn với người dùng đã đăng nhập — luôn lấy mới mỗi lần vào trang,
// không để Next.js đóng băng thành trang tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const supabase = await createSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileId = await getOrCreateProfileForUser(supabase, user.id);
  const [documents, schools] = await Promise.all([
    getProfileDocuments(supabase, profileId),
    listSchools(),
  ]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-sm text-muted-foreground">Cổng hồ sơ học viên</p>
            <h1 className="text-2xl font-medium tracking-tight">{user.email}</h1>
          </div>
          <LogoutButton />
        </div>

        <PortalClient initialDocuments={documents} schools={schools} />
      </main>
    </>
  );
}
