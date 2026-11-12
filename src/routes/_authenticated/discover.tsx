import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, TrendingUp, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { tagsQuery, myTagsQuery, TAG_CATEGORIES, initials } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Lens" },
      { name: "description", content: "Find people through shared interests and communities." },
      { property: "og:title", content: "Discover — Lens" },
      { property: "og:description", content: "Find people through shared interests and communities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: tags = [] } = useQuery(tagsQuery());
  const { data: mine = [] } = useQuery(myTagsQuery(userId));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const myIds = useMemo(() => new Set(mine.map((m) => m.tag_id)), [mine]);
  const publicIds = useMemo(() => mine.filter((m) => m.is_public).map((m) => m.tag_id), [mine]);

  const { data: people = [] } = useQuery({
    queryKey: ["people", userId, [...publicIds].sort().join(",")],
    enabled: publicIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tags")
        .select("user_id, tag_id, profiles!inner(username, display_name, avatar_url, onboarded)")
        .in("tag_id", publicIds)
        .neq("user_id", userId)
        .eq("is_public", true)
        .limit(500);
      if (error) throw error;
      const byUser = new Map<string, { profile: { username: string | null; display_name: string | null }; tags: string[] }>();
      for (const r of data ?? []) {
        const e = byUser.get(r.user_id) ?? { profile: r.profiles, tags: [] };
        e.tags.push(r.tag_id);
        byUser.set(r.user_id, e);
      }
      return [...byUser.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.tags.length - a.tags.length);
    },
  });

  const tagName = (id: string) => tags.find((t) => t.id === id)?.name ?? "";
  const trending = [...tags].sort((a, b) => b.followers - a.followers).slice(0, 6);
  const shown = tags.filter((t) => (cat === "All" || t.category === cat) && t.name.toLowerCase().includes(q.toLowerCase()));
  const exact = tags.some((t) => t.name.toLowerCase() === q.trim().toLowerCase());

  async function follow(id: string) {
    const { error } = myIds.has(id)
      ? await supabase.from("user_tags").delete().eq("user_id", userId).eq("tag_id", id)
      : await supabase.from("user_tags").insert({ user_id: userId, tag_id: id });
    if (error) return void toast.error(error.message);
    qc.invalidateQueries();
  }

  async function createTag() {
    const name = q.trim();
    if (name.length < 2 || name.length > 30) return void toast.error("Tag names are 2–30 characters");
    const slug = name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
    const { data, error } = await supabase.from("tags").insert({ name, slug, category: "Community", created_by: userId }).select().single();
    if (error) return void toast.error(error.code === "23505" ? "That tag already exists" : error.message);
    await supabase.from("user_tags").insert({ user_id: userId, tag_id: data.id });
    setQ("");
    toast.success(`#${name} created`);
    qc.invalidateQueries();
  }

  return (
    <AppShell>
      <PageHeader title="Discover" />
      <div className="space-y-7 px-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or create a tag" className="h-11 rounded-full pl-10" />
        </div>

        {q.trim() && !exact && (
          <Button variant="glass" className="w-full" onClick={createTag}><Plus className="h-4 w-4" />Create #{q.trim()}</Button>
        )}

        {!q && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-cyan" />Trending</h2>
            <div className="grid grid-cols-2 gap-3">
              {trending.map((t, i) => (
                <button key={t.id} onClick={() => follow(t.id)}
                  className={cn("relative overflow-hidden rounded-3xl p-4 text-left transition", i === 0 ? "col-span-2 bg-gradient-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">{t.category}</div>
                  <div className="mt-1 font-display text-lg font-semibold">#{t.name}</div>
                  <div className="mt-2 text-xs opacity-80">{t.followers} {t.followers === 1 ? "member" : "members"} · {myIds.has(t.id) ? "Following" : "Tap to follow"}</div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary-glow" />People who share your interests</h2>
          {people.length === 0 ? (
            <p className="rounded-3xl bg-card p-5 text-sm text-muted-foreground">No matches yet. Follow more tags — new people show up here as they join.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
              {people.map((p) => (
                <Link key={p.id} to="/u/$username" params={{ username: p.profile.username ?? "" }} className="w-40 shrink-0 rounded-3xl bg-card p-4">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary font-display font-bold text-primary-foreground">{initials(p.profile.display_name)}</div>
                  <div className="truncate font-semibold">{p.profile.display_name}</div>
                  <div className="truncate text-xs text-muted-foreground">@{p.profile.username}</div>
                  <div className="mt-2 text-[11px] text-cyan">{p.tags.length} shared</div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">{p.tags.slice(0, 2).map((t) => `#${tagName(t)}`).join(" ")}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
            {["All", ...TAG_CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm", cat === c ? "bg-foreground text-background" : "bg-card text-muted-foreground")}>{c}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {shown.map((t) => (
              <button key={t.id} onClick={() => follow(t.id)}
                className={cn("rounded-full border px-3.5 py-2 text-sm transition", myIds.has(t.id) ? "border-transparent bg-gradient-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                #{t.name} <span className="opacity-60">{t.followers}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
