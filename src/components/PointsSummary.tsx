import { useSuspenseQuery } from "@tanstack/react-query";
import { Sparkles, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { socialQuery, friendProfiles } from "@/lib/social";

export function PointsSummary() {
  const { data } = useSuspenseQuery(socialQuery());
  const total = data.points.reduce((sum, p) => sum + p.points, 0);
  return <section className="space-y-3 border-y py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan" /><span className="font-display text-xl font-bold">{total}</span><span className="text-xs text-muted-foreground">Lens points</span></div><Button asChild variant="ghost" size="sm"><Link to="/friends"><Users className="h-4 w-4" />{friendProfiles(data).length} friends</Link></Button></div>{data.points.slice(0, 3).map((p) => <div key={p.id} className="flex justify-between text-xs text-muted-foreground"><span>{p.reason}</span><span className="text-cyan">+{p.points}</span></div>)}</section>;
}