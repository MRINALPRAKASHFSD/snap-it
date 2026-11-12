import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { myTagsQuery, initials } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { FriendAction } from "@/components/FriendAction";
import { socialHead } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/u/$username")({
  head: ({ params }) => socialHead(`@${params.username}`, `See @${params.username}'s interests on Lens.`),
  component: UserPage,
});

function UserPage() {
  const { username } = Route.useParams();
  const { userId } = Route.useRouteContext();
  const { data: mine = [] } = useQuery(myTagsQuery(userId));
  const { data } = useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      const { data: p, error } = await supabase.rpc("visible_profile", { handle: username }).maybeSingle();
      if (error) throw error;
      if (!p) return null;
      // RLS returns only this user's public tags.
      const { data: t } = await supabase.from("user_tags").select("tag_id, tags(name)").eq("user_id", p.id).eq("is_public", true);
      return { p, tags: t ?? [] };
    },
  });
  const myIds = new Set(mine.map((m) => m.tag_id));

  return (
    <AppShell>
      <div className="p-5">
        <Link to="/discover" className="glass inline-grid h-10 w-10 place-items-center rounded-full" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Link>
        {data === null ? (
          <p className="mt-10 text-center text-muted-foreground">User not found.</p>
        ) : data && (
          <div className="mt-6 space-y-6 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-primary font-display text-3xl font-bold text-primary-foreground shadow-glow">{initials(data.p.display_name)}</div>
            <div>
              <h1 className="text-2xl font-bold">{data.p.display_name}</h1>
              <p className="text-muted-foreground">@{data.p.username}</p>
              {data.p.bio && <p className="mt-3 text-sm">{data.p.bio}</p>}
            </div>
            <Suspense fallback={<Button disabled>Loading…</Button>}><FriendAction userId={userId} targetId={data.p.id} /></Suspense>
            <div className="flex flex-wrap justify-center gap-2">
              {data.tags.map((t) => (
                <span key={t.tag_id} className={cn("rounded-full border px-3 py-1.5 text-sm", myIds.has(t.tag_id) ? "border-transparent bg-gradient-primary text-primary-foreground" : "bg-card")}>
                  #{t.tags?.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Highlighted tags are ones you share.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
