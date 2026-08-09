import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, LayoutGrid, LogOut, Plus, Settings, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const nav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard", label: "Meetings", icon: LayoutGrid },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, team_role")
        .eq("id", auth.user.id)
        .maybeSingle();
      return { email: auth.user.email ?? "", ...data };
    },
  });

  const initials = (profile?.full_name || profile?.email || "?").slice(0, 1).toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map(({ to, label, icon: Icon }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link to="/new">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New meeting</span>
              </Link>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
            <Avatar className="size-8">
              <AvatarFallback className="bg-surface text-xs">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <nav className="flex items-center gap-1 border-t border-border/60 px-3 py-2 sm:hidden">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
