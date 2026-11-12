import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Users, ArrowLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { FriendAction } from "@/components/FriendAction";
import { SocialAvatar } from "@/components/SocialAvatar";
import { socialQuery, socialHead, friendProfiles, useSocialRealtime } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => socialHead("Friends", "Manage friends and requests on Lens."),
  loader: ({ context }) => context.queryClient.ensureQueryData(socialQuery()),
  component: Friends,
});
function Friends() {
  const { data } = useSuspenseQuery(socialQuery());
  useSocialRealtime();
  const incoming = data.friendships.filter((f) => f.status === "pending" && f.recipient_id === data.userId).map((f) => data.profiles.find((p) => p.id === f.requester_id));
  const outgoing = data.friendships.filter((f) => f.status === "pending" && f.requester_id === data.userId).map((f) => data.profiles.find((p) => p.id === f.recipient_id));
  const blocked = data.blocks.filter((b) => b.blocker_id === data.userId).map((b) => data.profiles.find((p) => p.id === b.blocked_id));
  const groups = [{ title: "Requests", people: incoming }, { title: "Friends", people: friendProfiles(data) }, { title: "Sent requests", people: outgoing }, { title: "Blocked", people: blocked }];
  return <AppShell><PageHeader title="Friends" action={<Button asChild variant="glass" size="icon" aria-label="Back to chats"><Link to="/chats"><ArrowLeft className="h-4 w-4" /></Link></Button>} /><div className="space-y-8 px-5">{groups.map(({ title, people }) => <section key={title}><h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title} · {people.length}</h2>{!people.length ? <p className="py-3 text-sm text-muted-foreground">{title === "Friends" ? "Your circle starts here." : "None right now."}</p> : people.map((p) => p && <div key={p.id} className="flex flex-wrap items-center gap-3 border-b py-3"><SocialAvatar name={p.display_name} /><Link to="/u/$username" params={{ username: p.username ?? "" }} className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{p.display_name}</div><p className="truncate text-xs text-muted-foreground">@{p.username}</p></Link><FriendAction userId={data.userId} targetId={p.id} /></div>)}</section>)}<Button asChild variant="hero" className="w-full"><Link to="/discover"><Users className="h-4 w-4" />Find people</Link></Button></div></AppShell>;
}