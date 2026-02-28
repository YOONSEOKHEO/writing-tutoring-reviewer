import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ReviewClient from "./ReviewClient";

export const revalidate = 60;

async function getSessionData(id) {
  const [sessionRes, utteranceRes, highlightRes, tagRes, commentRes, noteRes] =
    await Promise.all([
      supabase.from("sessions").select("*").eq("id", id).single(),
      supabase
        .from("utterances")
        .select("*")
        .eq("session_id", id)
        .order("seq"),
      supabase.from("highlights").select("*").eq("session_id", id),
      supabase.from("tags").select("*").eq("session_id", id),
      supabase
        .from("comments")
        .select("*")
        .eq("session_id", id)
        .order("created_at"),
      supabase.from("global_notes").select("*").eq("session_id", id),
    ]);

  if (sessionRes.error || !sessionRes.data) return null;

  return {
    session: sessionRes.data,
    utterances: utteranceRes.data || [],
    highlights: highlightRes.data || [],
    tags: tagRes.data || [],
    comments: commentRes.data || [],
    globalNotes: noteRes.data || [],
  };
}

export default async function SessionPage({ params }) {
  const { id } = await params;
  const data = await getSessionData(id);

  if (!data) notFound();

  return <ReviewClient initialData={data} />;
}
