import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Check, X, UserMinus, MessageCircle, Ban } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { socialQuery, useSocialRealtime } from "@/lib/social";

export function FriendAction({ userId, targetId }: { userId: string; targetId: string }) {
  const { data } = useSuspenseQuery(socialQuery());
  const qc = useQueryClient();
  useSocialRealtime();
  const block = data.blocks.find((b) => (b.blocker_id === userId && b.blocked_id === targetId) || (b.blocked_id === userId && b.blocker_id === targetId));
  const friendship = data.friendships.find((f) => [f.requester_id, f.recipient_id].includes(targetId));
  const mutation = useMutation({
    mutationFn: async (action: "request" | "accept" | "delete" | "block" | "unblock") => {
      const result = action === "block" ? await supabase.from("blocks").insert({ blocker_id: userId, blocked_id: targetId })
        : action === "unblock" ? await supabase.from("blocks").delete().eq("blocker_id", userId).eq("blocked_id", targetId)
        : action === "request" ? await supabase.from("friendships").insert({ requester_id: userId, recipient_id: targetId })
        : action === "accept" && friendship ? await supabase.rpc("accept_friend", { request_id: friendship.id })
        : friendship ? await supabase.from("friendships").delete().eq("id", friendship.id) : null;
      if (result?.error) throw new Error(result.error.message);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["social"] }); void qc.invalidateQueries({ queryKey: ["people"] }); },
    onError: (e) => toast.error(e.message),
  });
  if (targetId === userId) return null;
  if (block) return block.blocker_id === userId ? <Button variant="glass" disabled={mutation.isPending} onClick={() => mutation.mutate("unblock")}><Ban className="h-4 w-4" />Unblock</Button> : <p className="text-sm text-muted-foreground">Connection unavailable</p>;
  const blockButton = <Button variant="glass" size="icon" title="Block user" aria-label="Block user" disabled={mutation.isPending} onClick={() => { if (window.confirm("Block this user? This removes your connection and prevents messages and story access.")) mutation.mutate("block"); }}><Ban className="h-4 w-4" /></Button>;
  if (!friendship) return <div className="flex justify-center gap-2"><Button variant="hero" disabled={mutation.isPending} onClick={() => mutation.mutate("request")}><UserPlus className="h-4 w-4" />Add friend</Button>{blockButton}</div>;
  if (friendship.status === "accepted") return <div className="flex justify-center gap-2"><Button asChild variant="hero"><Link to="/chat/$friendId" params={{ friendId: targetId }}><MessageCircle className="h-4 w-4" />Chat</Link></Button><Button variant="glass" size="icon" title="Remove friend" aria-label="Remove friend" disabled={mutation.isPending} onClick={() => { if (window.confirm("Remove this friend?")) mutation.mutate("delete"); }}><UserMinus className="h-4 w-4" /></Button>{blockButton}</div>;
  if (friendship.requester_id === userId) return <div className="flex gap-2"><Button variant="glass" disabled={mutation.isPending} onClick={() => mutation.mutate("delete")}><X className="h-4 w-4" />Cancel request</Button>{blockButton}</div>;
  return <div className="flex gap-2"><Button variant="hero" disabled={mutation.isPending} onClick={() => mutation.mutate("accept")}><Check className="h-4 w-4" />Accept</Button><Button variant="glass" size="icon" aria-label="Decline request" disabled={mutation.isPending} onClick={() => mutation.mutate("delete")}><X className="h-4 w-4" /></Button>{blockButton}</div>;
}