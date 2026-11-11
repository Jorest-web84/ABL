import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StudentActivity } from "@/components/StudentActivity";
import type { Activity } from "@/types/activity";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("activities").select("content").eq("id", id).eq("is_published", true).single();
  if (!data?.content) notFound();
  return <main className="student-shell"><StudentActivity activity={data.content as Activity} /></main>;
}
