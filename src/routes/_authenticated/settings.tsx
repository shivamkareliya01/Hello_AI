import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Hello_Ai" },
      { name: "description", content: "Update your profile, summary style and appearance in Hello_Ai." },
      { property: "og:title", content: "Settings — Hello_Ai" },
      { property: "og:description", content: "Personalize how Hello_Ai writes your meeting recaps." },
    ],
  }),
  component: Settings,
});

const STYLES = [
  { id: "concise", label: "Concise", hint: "A tight paragraph plus the essentials." },
  { id: "detailed", label: "Detailed", hint: "Thorough narrative with context." },
  { id: "bullets", label: "Bullet-point only", hint: "No prose — just crisp bullets." },
];

function Settings() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [style, setStyle] = useState("concise");

  const { data: profile } = useQuery({
    queryKey: ["profile-settings"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, team_role, summary_style")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return { email: auth.user.email ?? "", id: auth.user.id, ...data };
    },
  });

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setTeamRole(profile.team_role ?? "");
    setStyle(profile.summary_style ?? "concise");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: profile.id, full_name: fullName, team_role: teamRole, summary_style: style });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      toast.success("Preferences saved");
    },
    onError: () => toast.error("Could not save your preferences"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{profile?.email ?? "…"}</span>
        </p>
      </div>

      <div className="surface-panel space-y-5 p-6">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role / team</Label>
          <Input
            id="role"
            value={teamRole}
            onChange={(e) => setTeamRole(e.target.value)}
            placeholder="Product · Growth team"
          />
        </div>
      </div>

      <div className="surface-panel space-y-4 p-6">
        <div>
          <h2 className="text-sm font-semibold">AI summary style</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Applied the next time Hello_Ai summarizes a meeting.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {STYLES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStyle(option.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                style === option.id
                  ? "border-primary/50 bg-accent"
                  : "border-border bg-surface hover:border-primary/30",
              )}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="surface-panel flex items-center justify-between p-6">
        <div>
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-xs text-muted-foreground">Switch between dark and light mode.</p>
        </div>
        <ThemeToggle />
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending && <Loader2 className="size-4 animate-spin" />}
        Save changes
      </Button>
    </div>
  );
}
