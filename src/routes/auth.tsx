import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Aperture } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lens" },
      { name: "description", content: "Join Lens: a camera-first social app for India's next generation." },
      { property: "og:title", content: "Sign in — Lens" },
      { property: "og:description", content: "Join Lens: a camera-first social app for India's next generation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setSent(true);
        else navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return void toast.error("Google sign-in failed");
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background bg-aurora px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-primary shadow-glow">
            <Aperture className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold">
            <span className="text-gradient">Lens</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Snap it. Filter it. Find your people.</p>
        </div>

        {sent ? (
          <div className="glass rounded-3xl p-6 text-center">
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to {email}. Open it to finish signing up.</p>
          </div>
        ) : (
          <div className="glass space-y-4 rounded-3xl p-6">
            <button
              type="button"
              onClick={google}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-[#8E918F] bg-[#131314] text-sm font-medium text-[#E3E3E3]"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.950-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.240 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={submit} className="space-y-3">
              <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-full px-5" />
              <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-full px-5" />
              <Button type="submit" variant="hero" className="h-11 w-full" disabled={busy}>
                {mode === "in" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
              {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </div>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">We never ask for or use your location.</p>
      </div>
    </div>
  );
}
