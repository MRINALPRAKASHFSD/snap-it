import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, LogOut, Pencil, ImageOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { myProfileQuery, myTagsQuery, tagsQuery, initials } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { PointsSummary } from "@/components/PointsSummary";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Lens" },
      { name: "description", content: "Your Lens profile, interests and private gallery." },
      { property: "og:title", content: "Profile — Lens" },
      { property: "og:description", content: "Your Lens profile, interests and private gallery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { userId } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useQuery(myProfileQuery());
  const { data: tags = [] } = useQuery(tagsQuery());
  const { data: mine = [] } = useQuery(myTagsQuery(userId));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [bioPublic, setBioPublic] = useState(true);

  const { data: gallery = [] } = useQuery({
    queryKey: ["gallery", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      if (!data?.length) return [];
      const { data: signed } = await supabase.storage.from("gallery").createSignedUrls(data.map((m) => m.storage_path), 3600);
      return data.map((m, i) => ({ ...m, url: signed?.[i]?.signedUrl }));
    },
  });

  const p = me?.profile;

  async function save() {
    const { error } = await supabase.from("profiles").update({ display_name: name, bio, bio_public: bioPublic }).eq("id", userId);
    if (error) return void toast.error(error.message);
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  async function togglePublic(tagId: string, isPublic: boolean) {
    await supabase.from("user_tags").update({ is_public: !isPublic }).eq("user_id", userId).eq("tag_id", tagId);
    qc.invalidateQueries({ queryKey: ["my-tags"] });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <PageHeader title="Profile" action={<Button variant="glass" size="icon" aria-label="Sign out" onClick={signOut}><LogOut className="h-4 w-4" /></Button>} />
      <div className="space-y-7 px-5">
        <div className="relative overflow-hidden rounded-3xl bg-card bg-aurora p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-primary font-display text-2xl font-bold text-primary-foreground shadow-glow">{initials(p?.display_name)}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-xl font-bold">{p?.display_name}</div>
              <div className="text-sm text-muted-foreground">@{p?.username}</div>
            </div>
            <Button variant="glass" size="icon" aria-label="Edit profile" onClick={() => { setName(p?.display_name ?? ""); setBio(p?.bio ?? ""); setBioPublic(p?.bio_public ?? true); setEditing(!editing); }}><Pencil className="h-4 w-4" /></Button>
          </div>
          {editing ? (
            <div className="mt-4 space-y-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="rounded-full" />
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" maxLength={160} className="rounded-2xl" />
              <label className="flex items-center justify-between text-sm">Public bio<Switch aria-label="Public bio" checked={bioPublic} onCheckedChange={setBioPublic} /></label>
              <Button variant="hero" className="w-full" onClick={save}>Save</Button>
            </div>
          ) : (
            p?.bio && <p className="mt-4 text-sm">{p.bio}</p>
          )}
        </div>

        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading points…</p>}><PointsSummary /></Suspense>
        <section>
          <h2 className="mb-1 text-sm font-semibold">Your interests</h2>
          <p className="mb-3 text-xs text-muted-foreground">Tap to switch between public and private.</p>
          <div className="flex flex-wrap gap-2">
            {mine.map((m) => (
              <button key={m.tag_id} onClick={() => togglePublic(m.tag_id, m.is_public)}
                className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm", m.is_public ? "border-primary/50 bg-accent" : "bg-card text-muted-foreground")}>
                {m.is_public ? <Eye className="h-3.5 w-3.5 text-cyan" /> : <EyeOff className="h-3.5 w-3.5" />}
                #{tags.find((t) => t.id === m.tag_id)?.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Private gallery</h2>
          {gallery.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl bg-card p-8 text-center text-sm text-muted-foreground"><ImageOff className="h-6 w-6" />Snaps you save from the camera appear here. Only you can see them.</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {gallery.map((g) => <img key={g.id} src={g.url ?? undefined} alt="Saved snap" loading="lazy" className="aspect-[3/4] w-full rounded-xl object-cover" />)}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
