import { Link } from "@tanstack/react-router";
import { Camera, MessageCircle, Compass, CircleDashed, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/", label: "Camera", icon: Camera },
  { to: "/stories", label: "Stories", icon: CircleDashed },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children, overlayNav = false }: { children: ReactNode; overlayNav?: boolean }) {
  return (
    <div className="min-h-dvh bg-shell md:flex md:items-center md:justify-center md:py-6">
      <div className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background md:h-[min(900px,calc(100dvh-3rem))] md:rounded-[2.5rem] md:border md:shadow-glow">
        <main className={cn("relative flex-1 overflow-y-auto no-scrollbar", !overlayNav && "pb-24")}>{children}</main>
        <nav className="absolute inset-x-3 bottom-3 z-30 glass rounded-full px-2 py-2">
          <ul className="flex items-center justify-between">
            {NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className="group flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition data-[status=active]:text-foreground"
                >
                  {to === "/" ? (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                      <Icon className="h-5 w-5" />
                    </span>
                  ) : (
                    <>
                      <Icon className="h-5 w-5 transition group-data-[status=active]:text-primary-glow" />
                      {label}
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-background/80 px-5 pb-3 pt-6 backdrop-blur-xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </header>
  );
}
