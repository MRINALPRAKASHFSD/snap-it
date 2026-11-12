import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Plus, X, Trash2, Eye, ChevronLeft, ChevronRight, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ShareSnap } from "@/components/ShareSnap";
import { SocialAvatar } from "@/components/SocialAvatar";
import { socialQuery, socialHead, useSocialRealtime } from "@/lib/social";
import { storyIsActive } from "@/lib/social-rules";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/stories")({
  head: () => socialHead("Stories", "Photo stories shared with your Lens friends for 24 hours."),
  loader: ({ context }) => context.queryClient.ensureQueryData(socialQuery()),
  component: Stories,
});

function Stories() {
  const { data } = useSuspenseQuery(socialQuery());
  useSocialRealtime();
  const qc = useQueryClient();
  const [source, setSource] = useState<File | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewers, setViewers] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);
  const stories = data.stories.filter((s) => storyIsActive(s.expires_at, clock));
  const active = stories.find((s) => s.id === activeId);
  const activeIndex = stories.findIndex((s) => s.id === activeId);
  const profile = (id: string) => data.profiles.find((p) => p.id === id);
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!activeId) return; const story = data.stories.find((s) => s.id === activeId); if (!story || story.owner_id === data.userId || data.views.some((v) => v.story_id === activeId && v.viewer_id === data.userId)) return; void supabase.from("story_views").insert({ story_id: activeId, viewer_id: data.userId }).then(({ error }) => { if (!error) void qc.invalidateQueries({ queryKey: ["social"] }); }); }, [activeId, data.userId, data.stories, data.views, qc]);
  const owners = [...new Set(stories.map((s) => s.owner_id))];
  return <AppShell><PageHeader title="Stories" action={<Button variant="hero" size="icon" aria-label="Add story" onClick={() => fileRef.current?.click()}><Plus className="h-5 w-5" /></Button>} /><input ref={fileRef} type="file" accept="image/*" aria-label="Story photo" className="hidden" onChange={(e) => { setSource(e.target.files?.[0] ?? null); e.target.value = ""; }} /><div className="px-5">
    <div className="mb-7 flex gap-5 overflow-x-auto py-2 no-scrollbar"><Button variant="ghost" className="h-auto shrink-0 flex-col gap-2 p-0" onClick={() => fileRef.current?.click()}><span className="grid h-16 w-16 place-items-center rounded-full border-2 border-dashed text-cyan"><Plus className="h-6 w-6" /></span><span className="text-xs">Your story</span></Button>{owners.map((id) => <Button key={id} variant="ghost" className="h-auto max-w-20 shrink-0 flex-col gap-2 p-0" onClick={() => { setActiveId(stories.find((s) => s.owner_id === id)?.id ?? null); setViewers(false); }}><span className="rounded-full border-2 border-primary-glow p-1"><SocialAvatar name={profile(id)?.display_name} className="h-14 w-14" /></span><span className="w-20 truncate text-xs">{id === data.userId ? "You" : profile(id)?.display_name}</span></Button>)}</div>
    {!stories.length && <div className="flex flex-col items-center gap-3 py-14 text-center"><CircleDashed className="h-12 w-12 text-primary-glow" /><h2 className="text-xl font-semibold">Little moments. Your circle.</h2><p className="text-sm text-muted-foreground">No stories right now.</p></div>}
    <div className="grid grid-cols-2 gap-3">{stories.map((s) => <Button key={s.id} variant="ghost" className="relative h-auto overflow-hidden rounded-lg p-0" onClick={() => { setActiveId(s.id); setViewers(false); }}><div className="aspect-[3/4] w-full bg-muted">{data.urls[s.storage_path] && <img src={data.urls[s.storage_path]} alt={s.caption || "Photo story"} className="h-full w-full object-cover" />}</div><span className="absolute inset-x-0 bottom-0 bg-shell/80 p-3 text-left backdrop-blur"><span className="block truncate text-xs font-semibold">{s.owner_id === data.userId ? "You" : profile(s.owner_id)?.display_name}</span><span className="block text-[10px] text-muted-foreground">{Math.max(1, Math.ceil((new Date(s.expires_at).getTime() - clock) / 3600_000))}h left</span></span></Button>)}</div>
  </div>{source && <ShareSnap source={source} userId={data.userId} mode="story" onClose={() => setSource(null)} />}
  {active && <div role="dialog" aria-label="Story viewer" className="absolute inset-0 z-50 flex flex-col bg-shell"><header className="flex items-center gap-3 p-4"><SocialAvatar name={profile(active.owner_id)?.display_name} /><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">{profile(active.owner_id)?.display_name}</h2><p className="text-[10px] text-muted-foreground">{active.audience === "selected" ? "Selected friends" : "Friends"}</p></div><Button variant="glass" size="icon" aria-label="Close story" onClick={() => setActiveId(null)}><X className="h-4 w-4" /></Button></header><div className="relative flex min-h-0 flex-1 items-center justify-center">{data.urls[active.storage_path] ? <img src={data.urls[active.storage_path]} alt={active.caption || "Photo story"} className="h-full w-full object-contain" /> : <p>Photo unavailable</p>}<Button variant="glass" size="icon" aria-label="Previous story" className="absolute left-2" disabled={activeIndex <= 0} onClick={() => { setActiveId(stories[activeIndex - 1]?.id ?? null); setViewers(false); }}><ChevronLeft className="h-5 w-5" /></Button><Button variant="glass" size="icon" aria-label="Next story" className="absolute right-2" disabled={activeIndex >= stories.length - 1} onClick={() => { setActiveId(stories[activeIndex + 1]?.id ?? null); setViewers(false); }}><ChevronRight className="h-5 w-5" /></Button></div><footer className="space-y-3 p-4">{active.caption && <p className="break-words text-sm">{active.caption}</p>}{active.owner_id === data.userId && <div className="flex justify-between"><Button variant="glass" onClick={() => setViewers(!viewers)}><Eye className="h-4 w-4" />{data.views.filter((v) => v.story_id === active.id).length} views</Button><Button variant="glass" size="icon" aria-label="Delete story" onClick={async () => { if (!window.confirm("Delete this story?")) return; const { error } = await supabase.from("stories").delete().eq("id", active.id); if (error) toast.error(error.message); else { setActiveId(null); await qc.invalidateQueries({ queryKey: ["social"] }); } }}><Trash2 className="h-4 w-4" /></Button></div>}{viewers && active.owner_id === data.userId && <div className="max-h-32 overflow-y-auto text-sm text-muted-foreground">{data.views.filter((v) => v.story_id === active.id).map((v) => <p key={v.viewer_id}>{profile(v.viewer_id)?.display_name || "Friend"}</p>)}</div>}</footer></div>}
  </AppShell>;
}
