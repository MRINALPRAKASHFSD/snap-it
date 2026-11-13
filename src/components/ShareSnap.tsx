import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, CircleDashed } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { socialQuery, friendProfiles, uploadSnap } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import { SocialAvatar } from "@/components/SocialAvatar";

export function ShareSnap({ source, userId, mode, onClose, onShared }: { source: string | File; userId: string; mode: "story" | "send"; onClose: () => void; onShared?: () => void }) {
  const { data } = useSuspenseQuery(socialQuery());
  const friends = friendProfiles(data);
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<"friends" | "selected">("friends");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  async function share() {
    setBusy(true);
    try {
      const path = await uploadSnap(userId, source);
      const result = mode === "story"
        ? await supabase.from("stories").insert({ owner_id: userId, storage_path: path, caption, audience, selected_ids: audience === "selected" ? selected : [] })
        : await supabase.from("messages").insert(selected.map((recipient_id) => ({ sender_id: userId, recipient_id, body: caption, storage_path: path })));
      if (result.error) throw new Error(result.error.message);
      await qc.invalidateQueries({ queryKey: ["social"] });
      await qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success(mode === "story" ? "Story posted" : "Photo sent");
      onShared?.(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't share photo"); }
    finally { setBusy(false); }
  }
  return <Sheet open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><SheetContent side="bottom" className="mx-auto max-h-[80dvh] max-w-[440px] overflow-y-auto rounded-t-3xl"><SheetHeader><SheetTitle>{mode === "story" ? "Your story" : "Send photo"}</SheetTitle></SheetHeader><div className="space-y-4 px-4 pb-5">
    <Input aria-label="Photo caption" placeholder="Add a caption…" value={caption} maxLength={mode === "story" ? 160 : 2000} onChange={(e) => setCaption(e.target.value)} />
    {mode === "story" && <div className="flex gap-2"><Button variant={audience === "friends" ? "secondary" : "ghost"} onClick={() => setAudience("friends")}>All friends</Button><Button variant={audience === "selected" ? "secondary" : "ghost"} onClick={() => setAudience("selected")}>Selected friends</Button></div>}
    {(mode === "send" || audience === "selected") && <div className="space-y-3">{friends.length === 0 && <p className="text-sm text-muted-foreground">No friends yet.</p>}{friends.map((f) => <label key={f.id} className="flex items-center gap-3"><SocialAvatar name={f.display_name} /><span className="min-w-0 flex-1 truncate text-sm">{f.display_name || f.username}</span><Checkbox aria-label={`Select ${f.display_name || f.username}`} checked={selected.includes(f.id)} onCheckedChange={(checked) => setSelected((s) => checked ? [...s, f.id] : s.filter((id) => id !== f.id))} /></label>)}</div>}
    <Button variant="hero" className="w-full" disabled={busy || ((mode === "send" || audience === "selected") && !selected.length)} onClick={share}>{mode === "story" ? <CircleDashed className="h-4 w-4" /> : <Send className="h-4 w-4" />}{busy ? "Sharing…" : mode === "story" ? "Post story · 24 hours" : "Send"}</Button>
  </div></SheetContent></Sheet>;
}