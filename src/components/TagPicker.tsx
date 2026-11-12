import { useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TAG_CATEGORIES } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Tag = { id: string; name: string; category: string; followers?: number };

export function TagPicker({ tags, selected, onToggle }: { tags: Tag[]; selected: Set<string>; onToggle: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => tags.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())), [tags, q]);
  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search interests" className="h-11 rounded-full pl-10" />
      </div>
      {TAG_CATEGORIES.map((c) => {
        const list = filtered.filter((t) => t.category === c);
        if (!list.length) return null;
        return (
          <section key={c}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c}</h3>
            <div className="flex flex-wrap gap-2">
              {list.map((t) => {
                const on = selected.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => onToggle(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition",
                      on ? "border-transparent bg-gradient-primary text-primary-foreground shadow-glow" : "bg-card hover:bg-accent",
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}#{t.name}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
