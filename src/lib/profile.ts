import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const myProfileQuery = () =>
  queryOptions({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase.rpc("my_private_profile").maybeSingle();
      if (error) throw error;
      return { user: u.user, profile: data };
    },
  });

export const tagsQuery = () =>
  queryOptions({
    queryKey: ["tags"],
    queryFn: async () => {
      const [{ data: tags, error }, { data: counts }] = await Promise.all([
        supabase.from("tags").select("*").order("name"),
        supabase.rpc("tag_counts"),
      ]);
      if (error) throw error;
      const map = new Map((counts ?? []).map((c) => [c.tag_id, Number(c.followers)]));
      return (tags ?? []).map((t) => ({ ...t, followers: map.get(t.id) ?? 0 }));
    },
  });

export const myTagsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-tags", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_tags").select("tag_id, is_public").eq("user_id", userId);
      if (error) throw error;
      return data ?? [];
    },
  });

export const TAG_CATEGORIES = ["Technology", "Entertainment", "Education", "Lifestyle", "Indian Communities", "Community"] as const;

export function initials(name?: string | null) {
  return (name ?? "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}
