import type { LucideIcon } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";

export function ComingSoon({ title, icon: Icon, text }: { title: string; icon: LucideIcon; text: string }) {
  return (
    <AppShell>
      <PageHeader title={title} />
      <div className="flex flex-col items-center gap-4 px-8 pt-24 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-card bg-aurora"><Icon className="h-8 w-8 text-primary-glow" /></div>
        <h2 className="text-xl font-semibold">Coming next</h2>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </AppShell>
  );
}
