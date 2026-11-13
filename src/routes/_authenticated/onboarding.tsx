import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagPicker } from "@/components/TagPicker";
import { tagsQuery } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { socialHead } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => socialHead("Welcome", "Set up your Lens profile and interests."),
  component: Onboarding,
});

function Onboarding() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: tags = [] } = useQuery(tagsQuery());
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const thisYear = new Date().getFullYear();

  function toggle(set: Set<string>, id: string, fn: (s: Set<string>) => void) {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    fn(n);
  }

  async function step1() {
    const u = username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(u)) return void toast.error("Username: 3–20 letters, numbers, _ or .");
    const y = Number(year);
    if (!y || y > thisYear - 13 || y < thisYear - 100) return void toast.error("You must be at least 13 to use Lens");
    const { data } = await supabase.from("profiles").select("id").eq("username", u).neq("id", userId).maybeSingle();
    if (data) return void toast.error("That username is taken");
    setUsername(u);
    setStep(1);
  }

  async function finish() {
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ username, display_name: name || username, birth_year: Number(year), onboarded: true }).eq("id", userId);
      if (error) throw error;
      await supabase.from("user_tags").delete().eq("user_id", userId);
      if (selected.size) {
        const { error: e2 } = await supabase.from("user_tags").insert([...selected].map((tag_id) => ({ user_id: userId, tag_id, is_public: !hidden.has(tag_id) })));
        if (e2) throw e2;
      }
      await qc.invalidateQueries();
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  const chosen = tags.filter((t) => selected.has(t.id));

  return (
    <div className="min-h-dvh bg-background bg-aurora">
      <div className="mx-auto max-w-[440px] px-6 pb-32 pt-10">
        <div className="mb-8 flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gradient-primary" : "bg-muted")} />)}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div><h1 className="text-3xl font-bold">Make it yours</h1><p className="mt-2 text-muted-foreground">How should people find you?</p></div>
            <div className="space-y-3">
              <Input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 rounded-full px-5" />
              <Input placeholder="Display name (any language — नमस्ते, வணக்கம்)" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-full px-5" />
              <Input type="number" placeholder="Birth year" value={year} onChange={(e) => setYear(e.target.value)} className="h-12 rounded-full px-5" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div><h1 className="text-3xl font-bold">What are you into?</h1><p className="mt-2 text-muted-foreground">Pick at least 3. This is how you'll find your people.</p></div>
            <TagPicker tags={tags} selected={selected} onToggle={(id) => toggle(selected, id, setSelected)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div><h1 className="text-3xl font-bold">Who sees what</h1><p className="mt-2 text-muted-foreground">Public tags help others discover you. Private ones stay just for you.</p></div>
            <ul className="space-y-2">
              {chosen.map((t) => {
                const priv = hidden.has(t.id);
                return (
                  <li key={t.id}>
                    <button onClick={() => toggle(hidden, t.id, setHidden)} className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3 text-left">
                      <span>#{t.name}</span>
                      <span className={cn("flex items-center gap-1.5 text-xs", priv ? "text-muted-foreground" : "text-cyan")}>
                        {priv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{priv ? "Private" : "Public"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-6">
        <div className="mx-auto flex max-w-[392px] gap-3">
          {step > 0 && <Button variant="glass" className="h-12 px-6" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button
            variant="hero"
            className="h-12 flex-1"
            disabled={busy || (step === 1 && selected.size < 3)}
            onClick={() => (step === 0 ? step1() : step === 1 ? setStep(2) : finish())}
          >
            {step === 2 ? (busy ? "Saving…" : "Open camera") : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
