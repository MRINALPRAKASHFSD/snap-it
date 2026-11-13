import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SHARED_URL_SECONDS } from "@/lib/social-rules";

export const getSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const results = await Promise.all([
      db.from("friendships").select("*").order("created_at", { ascending: false }),
      db.from("messages").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("stories").select("*").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
      db.from("point_events").select("*").order("created_at", { ascending: false }),
      db.from("story_views").select("*"),
       db.from("blocks").select("*"),
    ]);
    for (const result of results) if (result.error) throw new Error(result.error.message);
    const [friendships, messages, stories, points, views, blocks] = results;
    const ids = new Set<string>([context.userId]);
    for (const f of friendships.data ?? []) { ids.add(f.requester_id); ids.add(f.recipient_id); }
    for (const m of messages.data ?? []) { ids.add(m.sender_id); ids.add(m.recipient_id); }
    for (const s of stories.data ?? []) ids.add(s.owner_id);
    for (const v of views.data ?? []) ids.add(v.viewer_id);
    for (const b of blocks.data ?? []) { ids.add(b.blocker_id); ids.add(b.blocked_id); }
    const { data: profiles, error } = await db.from("profiles").select("id, username, display_name").in("id", [...ids]);
    if (error) throw new Error(error.message);
    const paths = [...new Set([...(messages.data ?? []).map((m) => m.storage_path), ...(stories.data ?? []).map((s) => s.storage_path)].filter((p): p is string => !!p))];
    const { data: signed, error: signingError } = paths.length
      ? await db.storage.from("gallery").createSignedUrls(paths, SHARED_URL_SECONDS)
      : { data: [], error: null };
    if (signingError) throw new Error(signingError.message);
    const urls: Record<string, string> = {};
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls[s.path] = s.signedUrl;
    return { userId: context.userId, friendships: friendships.data ?? [], messages: messages.data ?? [], stories: stories.data ?? [], points: points.data ?? [], views: views.data ?? [], blocks: blocks.data ?? [], profiles: profiles ?? [], urls };
  });