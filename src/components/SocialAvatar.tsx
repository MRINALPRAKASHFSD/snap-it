import { initials } from "@/lib/profile";
import { cn } from "@/lib/utils";
export function SocialAvatar({ name, className }: { name?: string | null | undefined; className?: string }) {
  return <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground", className)}>{initials(name)}</span>;
}