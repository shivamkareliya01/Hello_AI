import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Mic, Tag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Meeting insights — Hello_Ai" },
      { name: "description", content: "See how much time you spend in meetings and who owns the most action items." },
      { property: "og:title", content: "Meeting insights — Hello_Ai" },
      { property: "og:description", content: "Trends across your transcribed meetings." },
    ],
  }),
  component: Insights,
});

function weekKey(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Insights() {
  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      const [meetings, actions] = await Promise.all([
        supabase.from("meetings").select("duration_seconds, meeting_date, summary, status"),
        supabase.from("action_items").select("owner, done"),
      ]);
      if (meetings.error) throw meetings.error;
      if (actions.error) throw actions.error;
      return { meetings: meetings.data ?? [], actions: actions.data ?? [] };
    },
  });

  const stats = useMemo(() => {
    const meetings = data?.meetings ?? [];
    const actions = data?.actions ?? [];
    const totalSeconds = meetings.reduce((sum, m) => sum + Number(m.duration_seconds ?? 0), 0);

    const owners = new Map<string, number>();
    actions.forEach((a) => {
      const owner = (a.owner ?? "").trim();
      if (!owner) return;
      owners.set(owner, (owners.get(owner) ?? 0) + 1);
    });

    const topics = new Map<string, number>();
    meetings.forEach((m) => {
      const list = ((m.summary as { topics?: string[] } | null)?.topics ?? []) as string[];
      list.forEach((t) => topics.set(t, (topics.get(t) ?? 0) + 1));
    });

    const buckets = new Map<string, number>();
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      buckets.set(weekKey(d), 0);
    }
    meetings.forEach((m) => {
      const key = weekKey(new Date(m.meeting_date));
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });

    return {
      total: meetings.length,
      hours: (totalSeconds / 3600).toFixed(1),
      openActions: actions.filter((a) => !a.done).length,
      owners: [...owners.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      topics: [...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
      chart: [...buckets.entries()].map(([week, meetings]) => ({ week, meetings })),
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const cards = [
    { label: "Meetings captured", value: stats.total, icon: Mic },
    { label: "Hours transcribed", value: stats.hours, icon: Clock },
    { label: "Open action items", value: stats.openActions, icon: Users },
    { label: "Distinct topics", value: stats.topics.length, icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How your meeting time and follow-ups trend over time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="surface-panel p-5">
        <h2 className="text-sm font-semibold">Meetings per week</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  color: "var(--popover-foreground)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="meetings" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-5">
          <h2 className="text-sm font-semibold">Most frequent action-item owners</h2>
          {stats.owners.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No owners identified yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.owners.map(([owner, count]) => (
                <li key={owner} className="flex items-center justify-between gap-4 text-sm">
                  <span>{owner}</span>
                  <span className="text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-panel p-5">
          <h2 className="text-sm font-semibold">Most discussed topics</h2>
          {stats.topics.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Topics appear once meetings are summarized.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.topics.map(([topic, count]) => (
                <span
                  key={topic}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs"
                >
                  {topic} <span className="text-muted-foreground">×{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
