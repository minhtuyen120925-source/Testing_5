"use server";

import { revalidatePath } from "next/cache";
import { updateQuoteRequestStatus } from "@/lib/supabase/quote-requests";

export async function approveQuoteRequest(id: string) {
  await updateQuoteRequestStatus(id, "da_duyet");
  revalidatePath("/admin/requests");
}

export async function rejectQuoteRequest(id: string) {
  await updateQuoteRequestStatus(id, "tu_choi");
  revalidatePath("/admin/requests");
}
