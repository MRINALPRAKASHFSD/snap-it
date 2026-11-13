import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle, Users, Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialAvatar } from "@/components/SocialAvatar";
import { socialQuery, socialHead, friendProfiles, useSocialRealtime } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/chats")({
  head: () => socialHead("Chats", "Private live conversations with your Lens friends."),
  loader: ({ context }) => context.queryClient.ensureQueryData(socialQuery()),
  component: Chats,
});

function Chats() {
  const { data } = useSuspenseQuery(socialQuery());
  useSocialRealtime();
  const [search, setSearch] = useState("");
  const friends = friendProfiles(data).filter((p) => `${p.display_name} ${p.username}`.toLowerCase().includes(search.toLowerCase()));
  const pending = data.friendships.filter((f) => f.status === "pending" && f.recipient_id === data.userId).length;
  const contacts = data.profiles.filter((p) => p.id !== data.userId && (friends.some((f) => f.id === p.id) || data.messages.some((m) => m.sender_id === p.id || m.recipient_id === p.id))).filter((p) => `${p.display_name} ${p.username}`.toLowerCase().includes(search.toLowerCase()));
  contacts.sort((a, b) => (data.messages.find((m) => m.sender_id === b.id || m.recipient_id === b.id)?.created_at ?? "").localeCompare(data.messages.find((m) => m.sender_id === a.id || m.recipient_id === a.id)?.created_at ?? ""));
  return <AppShell><PageHeader title="Chats" action={<Button asChild variant="glass" size="icon" aria-label="Friends"><Link to="/friends"><Users className="h-4 w-4" /></Link></Button>} /><div className="px-5">
    {pending > 0 && <Button asChild variant="secondary" className="mb-4 w-full"><Link to="/friends">{pending} friend {pending === 1 ? "request" : "requests"}</Link></Button>}
    <div className="relative mb-5"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search friends" className="pl-10" /></div>
    {!contacts.length && <div className="flex flex-col items-center gap-3 py-16 text-center"><MessageCircle className="h-10 w-10 text-primary-glow" /><h2 className="font-display text-xl font-semibold">Your people, one chat away</h2><p className="text-sm text-muted-foreground">No conversations yet.</p><Button asChild variant="hero"><Link to="/discover">Find your people</Link></Button></div>}
    <ul className="divide-y divide-border">{contacts.map((p) => { const latest = data.messages.find((m) => m.sender_id === p.id || m.recipient_id === p.id); const unread = data.messages.filter((m) => m.sender_id === p.id && m.recipient_id === data.userId && !m.read_at).length; return <li key={p.id}><Link to="/chat/$friendId" params={{ friendId: p.id }} className="flex items-center gap-3 py-4"><SocialAvatar name={p.display_name} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate font-semibold">{p.display_name || p.username}</span>{latest && <span className="text-[10px] text-muted-foreground">{new Date(latest.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{latest ? `${latest.sender_id === data.userId ? "You: " : ""}${latest.storage_path ? "Photo · " : ""}${latest.body}` : "Say hello"}</p></div>{unread > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1 text-xs text-primary-foreground">{unread}</span>}</Link></li>; })}</ul>
  </div></AppShell>;
}
