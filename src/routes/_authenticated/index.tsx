import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CameraOff, Download, RefreshCw, SwitchCamera, Zap, ZapOff, SlidersHorizontal, Sparkles, X, Check, Send, CircleDashed } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCamera } from "@/lib/camera/useCamera";
import { FILTERS, DEFAULT_ADJ, composeFilter, type Adjustments } from "@/lib/camera/filters";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { ShareSnap } from "@/components/ShareSnap";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Camera — Lens" },
      { name: "description", content: "Capture photos with live filters on Lens." },
      { property: "og:title", content: "Camera — Lens" },
      { property: "og:description", content: "Capture photos with live filters on Lens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CameraScreen,
});

function CameraScreen() {
  const cam = useCamera();
  const { userId } = Route.useRouteContext();
  const [filterId, setFilterId] = useState("none");
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [library, setLibrary] = useState(false);
  const [tools, setTools] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState<"story" | "send" | null>(null);
  const filter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];
  if (!filter) return null;
  const css = composeFilter(filter, adj);

  function snap() {
    const img = cam.capture(css);
    if (img) setShot(img);
    else toast.error("Camera isn't ready yet");
  }

  async function save() {
    if (!shot) return;
    setSaving(true);
    try {
      const blob = await (await fetch(shot)).blob();
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("gallery").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const { error: e2 } = await supabase.from("media").insert({ owner_id: userId, storage_path: path, filter: filterId });
      if (e2) throw e2;
      toast.success("Saved to your private gallery");
      setShot(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  const categories = Array.from(new Set(FILTERS.map((f) => f.category)));

  return (
    <AppShell overlayNav>
      <div className="absolute inset-0 bg-shell">
        {cam.error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted"><CameraOff className="h-7 w-7 text-muted-foreground" /></div>
            <h2 className="text-xl font-semibold">
              {cam.error === "denied" ? "Camera access is blocked" : cam.error === "unsupported" ? "Camera not supported" : "No camera found"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {cam.error === "denied"
                ? "Allow camera access in your browser's site settings, then try again."
                : "We couldn't find a working camera on this device."}
            </p>
            <Button variant="hero" onClick={cam.retry}><RefreshCw className="h-4 w-4" />Try again</Button>
          </div>
        ) : (
          <video
            ref={cam.videoRef}
            playsInline
            muted
            className={cn("h-full w-full object-cover", cam.facing === "user" && "-scale-x-100")}
            style={{ filter: css }}
          />
        )}
      </div>

      {/* top controls */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <Link to="/profile" className="glass rounded-full px-4 py-2 font-display text-sm font-bold"><span className="text-gradient">Lens</span></Link>
        <div className="flex flex-col gap-2">
          <IconBtn label="Flip camera" onClick={cam.flip}><SwitchCamera className="h-5 w-5" /></IconBtn>
          {cam.torchSupported && (
            <IconBtn label="Flash" onClick={cam.toggleTorch}>{cam.torch ? <Zap className="h-5 w-5 text-cyan" /> : <ZapOff className="h-5 w-5" />}</IconBtn>
          )}
          <IconBtn label="Adjust" onClick={() => setTools(true)}><SlidersHorizontal className="h-5 w-5" /></IconBtn>
          <IconBtn label="Filter library" onClick={() => setLibrary(true)}><Sparkles className="h-5 w-5" /></IconBtn>
        </div>
      </div>

      {/* filter carousel + shutter */}
      {!cam.error && (
        <div className="absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-4">
          <div className="flex w-full gap-3 overflow-x-auto px-[calc(50%-28px)] no-scrollbar snap-x">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilterId(f.id)} className="flex shrink-0 snap-center flex-col items-center gap-1">
                <span
                  className={cn("h-14 w-14 rounded-full border-2 transition", f.id === filterId ? "scale-110 border-primary-glow shadow-glow" : "border-border")}
                  style={{ background: `radial-gradient(circle at 30% 30%, oklch(1 0 0 / 50%), ${f.swatch})` }}
                />
                <span className="text-[10px] font-medium">{f.name}</span>
              </button>
            ))}
          </div>
          <button
            aria-label="Take photo"
            onClick={snap}
            disabled={!cam.ready}
            className="grid h-20 w-20 place-items-center rounded-full border-4 border-foreground/90 transition active:scale-90 disabled:opacity-40"
          >
            <span className="h-16 w-16 rounded-full bg-foreground/90" />
          </button>
        </div>
      )}

      {/* preview */}
      {shot && (
        <div className="absolute inset-0 z-40 bg-shell">
          <img src={shot} alt="Your captured photo" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 flex justify-between p-4">
            <IconBtn label="Retake" onClick={() => setShot(null)}><X className="h-5 w-5" /></IconBtn>
            <IconBtn label="Download" onClick={() => { const a = document.createElement("a"); a.href = shot; a.download = "lens.jpg"; a.click(); }}><Download className="h-5 w-5" /></IconBtn>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-shell to-transparent p-5 pt-16">
            <div className="flex gap-2">
              <Button variant="glass" className="h-11 flex-1" onClick={() => setSharing("story")}><CircleDashed className="h-4 w-4" />Story</Button>
              <Button variant="glass" className="h-11 flex-1" onClick={() => setSharing("send")}><Send className="h-4 w-4" />Send</Button>
            </div>
            <Button variant="hero" className="h-12" onClick={save} disabled={saving}><Check className="h-4 w-4" />{saving ? "Saving…" : "Save to gallery"}</Button>
          </div>
        </div>
      )}

      {sharing && shot && <Suspense fallback={<div className="absolute inset-0 z-50 grid place-items-center bg-shell">Loading friends…</div>}><ShareSnap source={shot} userId={userId} mode={sharing} onClose={() => setSharing(null)} onShared={() => setShot(null)} /></Suspense>}
      <Sheet open={library} onOpenChange={setLibrary}>
        <SheetContent side="bottom" className="mx-auto max-h-[75dvh] max-w-[440px] overflow-y-auto rounded-t-3xl">
          <SheetHeader><SheetTitle>Filter library</SheetTitle></SheetHeader>
          <div className="space-y-5 p-4 pt-0">
            {categories.map((c) => (
              <section key={c}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {FILTERS.filter((f) => f.category === c).map((f) => (
                    <button key={f.id} onClick={() => { setFilterId(f.id); setLibrary(false); }} className="flex flex-col items-center gap-1.5">
                      <span className={cn("aspect-square w-full rounded-2xl border-2", f.id === filterId ? "border-primary-glow" : "border-transparent")}
                        style={{ background: `linear-gradient(135deg, oklch(1 0 0 / 40%), ${f.swatch})` }} />
                      <span className="text-[11px]">{f.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <p className="text-xs text-muted-foreground">Face tracking and AR lenses are on the way.</p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={tools} onOpenChange={setTools}>
        <SheetContent side="bottom" className="mx-auto max-w-[440px] rounded-t-3xl">
          <SheetHeader><SheetTitle>Adjust</SheetTitle></SheetHeader>
          <div className="space-y-5 p-4 pt-0">
            {([
              ["brightness", "Brightness", 50, 150],
              ["contrast", "Contrast", 50, 150],
              ["saturation", "Saturation", 0, 200],
              ["blur", "Blur", 0, 8],
            ] as const).map(([k, label, min, max]) => (
              <div key={k}>
                <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">{adj[k]}</span></div>
                <Slider min={min} max={max} step={1} value={[adj[k]]} onValueChange={([v]) => setAdj((a) => ({ ...a, [k]: v }))} />
              </div>
            ))}
            <Button variant="secondary" className="w-full rounded-full" onClick={() => setAdj(DEFAULT_ADJ)}>Reset</Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button aria-label={label} onClick={onClick} className="glass grid h-11 w-11 place-items-center rounded-full transition hover:bg-accent">
      {children}
    </button>
  );
}
