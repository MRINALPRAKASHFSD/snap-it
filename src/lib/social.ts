import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSocial } from "@/lib/social.functions";

export const socialQuery = () => queryOptions({
  queryKey: ["social"], queryFn: () => getSocial(), staleTime: 0, refetchInterval: 45_000,
});
export type SocialData = Awaited<ReturnType<typeof getSocial>>;
export type SocialProfile = SocialData["profiles"][number];
export function friendProfiles(data: SocialData) {
  const ids = data.friendships.filter((f) => f.status === "accepted").map((f) => f.requester_id === data.userId ? f.recipient_id : f.requester_id);
  return data.profiles.filter((p) => ids.includes(p.id));
}
export function useSocialRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel(`social-${crypto.randomUUID()}`);
    for (const table of ["messages", "friendships", "stories", "blocks", "story_views", "point_events"]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => { void qc.invalidateQueries({ queryKey: ["social"] }); void qc.invalidateQueries({ queryKey: ["people"] }); });
    }
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);
}
export async function uploadSnap(userId: string, source: string | File) {
  const blob = typeof source === "string" ? await (await fetch(source)).blob() : source;
  if (!blob.type.startsWith("image/")) throw new Error("Choose a photo");
  if (blob.size > 10 * 1024 * 1024) throw new Error("Photo must be under 10 MB");
  const path = `${userId}/${crypto.randomUUID()}.${blob.type === "image/png" ? "png" : "jpg"}`;
  const { error } = await supabase.storage.from("gallery").upload(path, blob, { contentType: blob.type });
  if (error) throw new Error(error.message);
  const { error: mediaError } = await supabase.from("media").insert({ owner_id: userId, storage_path: path });
  if (mediaError) { await supabase.storage.from("gallery").remove([path]); throw new Error(mediaError.message); }
  return path;
}
export function socialHead(title: string, description: string) {
  return { meta: [{ title: `${title} — Lens` }, { name: "description", content: description }, { property: "og:title", content: `${title} — Lens` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}