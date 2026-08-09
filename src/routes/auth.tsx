import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Hello_Ai" },
      { name: "description", content: "Sign in to Hello_Ai to transcribe and summarize your meetings." },
      { property: "og:title", content: "Sign in — Hello_Ai" },
      { property: "og:description", content: "Access your Hello_Ai meeting workspace." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setPendingConfirm(true);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-5 py-12">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {pendingConfirm ? (
          <div className="surface-panel p-6 text-center">
            <h1 className="text-xl font-semibold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Click it
              to activate your Hello_Ai account.
            </p>
            <Button variant="outline" className="mt-6 w-full" onClick={() => setPendingConfirm(false)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <div className="surface-panel p-6">
            <h1 className="text-xl font-semibold">
              {isSignup ? "Create your workspace" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isSignup
                ? "Start turning recordings into recaps."
                : "Sign in to see your meeting history."}
            </p>

            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={handleGoogle}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                {isSignup ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "New to Hello_Ai?"}{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setIsSignup((v) => !v)}
              >
                {isSignup ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
