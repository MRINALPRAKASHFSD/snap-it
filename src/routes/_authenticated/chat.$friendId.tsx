import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, ImagePlus, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SocialAvatar } from "@/components/SocialAvatar";
import { supabase } from "@/integrations/supabase/client";
import { socialQuery, socialHead, friendProfiles, uploadSnap, useSocialRealtime } from "@/lib/social";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$friendId")({
  head: () => socialHead("Conversation", "A private conversation with your Lens friend."),
  loader: ({ context }) => context.queryClient.ensureQueryData(socialQuery()),
  component: Conversation,
});
function Conversation() {
  const { friendId } = Route.useParams();
  const { data } = useSuspenseQuery(socialQuery());
  const qc = useQueryClient();
  useSocialRealtime();
  const person = data.profiles.find((p) => p.id === friendId);
  const isFriend = friendProfiles(data).some((p) => p.id === friendId);
  const messages = data.messages.filter((m) => m.sender_id === friendId || m.recipient_id === friendId).reverse();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const unread = messages.filter((m) => m.recipient_id === data.userId && !m.read_at).length;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "instant", block: "end" }); }, [messages.length]);
  useEffect(() => { if (!unread) return; void supabase.rpc("mark_messages_read", { friend_id: friendId }).then(({ error }) => { if (!error) void qc.invalidateQueries({ queryKey: ["social"] }); }); }, [unread, friendId, qc]);
  async function send(file?: File) {
    if (busy || (!body.trim() && !file)) return;
    setBusy(true);
    try {
      const path = file ? await uploadSnap(data.userId, file) : null;
      const { error } = await supabase.from("messages").insert({ sender_id: data.userId, recipient_id: friendId, body: body.trim(), storage_path: path });
      if (error) throw new Error(error.message);
      setBody(""); await qc.invalidateQueries({ queryKey: ["social"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't send"); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }
  return <AppShell><div className="flex min-h-full flex-col"><header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-4 backdrop-blur-xl"><Button asChild variant="ghost" size="icon" aria-label="Back to chats"><Link to="/chats"><ArrowLeft className="h-5 w-5" /></Link></Button><SocialAvatar name={person?.display_name} /><div className="min-w-0"><h1 className="truncate text-base font-semibold">{person?.display_name || "Conversation"}</h1><p className="text-xs text-muted-foreground">@{person?.username || "unknown"}</p></div></header>
    <div className="flex-1 space-y-3 p-4">{!messages.length && <p className="py-12 text-center text-sm text-muted-foreground">{isFriend ? "Say hello 👋" : "This conversation is unavailable."}</p>}{messages.map((m) => { const own = m.sender_id === data.userId; return <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] overflow-hidden rounded-lg px-3 py-2", own ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
      {m.storage_path && (data.urls[m.storage_path] ? <a href={data.urls[m.storage_path]} target="_blank" rel="noreferrer"><img src={data.urls[m.storage_path]} alt="Shared photo" className="mb-2 max-h-80 w-full rounded object-contain" /></a> : <p className="text-xs">Photo unavailable</p>)}
      {m.body && <p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.body}</p>}<div className="mt-1 flex justify-end gap-1 text-[9px] opacity-70"><span>{new Date(m.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>{own && m.read_at && <CheckCheck aria-label="Read" className="h-3 w-3" />}</div></div></div>; })}<div ref={endRef} /></div>
    <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="sticky bottom-0 flex items-end gap-2 border-t bg-background p-3"><input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label="Attach photo" onChange={(e) => { const file = e.target.files?.[0]; if (file) void send(file); }} /><Button type="button" variant="glass" size="icon" aria-label="Send photo" disabled={!isFriend || busy} onClick={() => fileRef.current?.click()}><ImagePlus className="h-5 w-5" /></Button><Textarea aria-label="Message" value={body} maxLength={2000} disabled={!isFriend || busy} placeholder={isFriend ? "Message…" : "Add as a friend to send"} onChange={(e) => setBody(e.target.value)} className="max-h-32 min-h-10 resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} /><Button type="submit" variant="hero" size="icon" aria-label="Send message" disabled={!isFriend || busy || !body.trim()}><Send className="h-4 w-4" /></Button></form>
  </div></AppShell>;
}