import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDuration,
  formatTimestamp,
  type ActionItem,
  type MeetingSummary,
  type Segment,
} from "@/lib/meeting-utils";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Shared meeting recap — Hello_Ai" },
      { name: "description", content: "A read-only meeting summary, decisions and action items shared from Hello_Ai." },
      { property: "og:title", content: "Shared meeting recap — Hello_Ai" },
      { property: "og:description", content: "AI-generated summary and action items from a Hello_Ai meeting." },
    ],
  }),
  component: SharedMeeting,
});

type SharedMeeting = {
  id: string;
  title: string;
  meeting_date: string;
  duration_seconds: number | null;
  tags: string[];
  segments: Segment[];
  summary: MeetingSummary | null;
};

function SharedMeeting() {
  const { token } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["shared", token],
    queryFn: async () => {
      const { data: meeting, error } = await supabase
        .from("meetings")
        .select("id, title, meeting_date, duration_seconds, tags, segments, summary")
        .eq("share_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!meeting) return null;
      const { data: items } = await supabase
        .from("action_items")
        .select("*")
        .eq("meeting_id", meeting.id)
        .order("created_at");
      return {
        meeting: meeting as unknown as SharedMeeting,
        items: (items ?? []) as ActionItem[],
      };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Logo />
          <Button size="sm" variant="outline" asChild>
            <Link to="/">Try Hello_Ai</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-10">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </>
        ) : !data ? (
          <div className="surface-panel p-10 text-center">
            <h1 className="text-xl font-semibold">This link isn't available</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The share link may have been revoked or never existed.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium tracking-wide text-primary uppercase">
                Shared meeting recap
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{data.meeting.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(data.meeting.meeting_date).toLocaleString()}</span>
                <span>{formatDuration(data.meeting.duration_seconds)}</span>
                {data.meeting.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {data.meeting.summary && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="surface-panel p-5 lg:col-span-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="size-4" /> Summary
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                    {data.meeting.summary.overview}
                  </p>
                </div>

                <div className="surface-panel p-5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <ListChecks className="size-4 text-primary" /> Action items
                  </h2>
                  {data.items.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">No action items.</p>
                  ) : (
                    <ul className="mt-3 space-y-2.5 text-sm">
                      {data.items.map((item) => (
                        <li key={item.id}>
                          {item.task}
                          {(item.owner || item.due_date) && (
                            <span className="block text-xs text-muted-foreground">
                              {item.owner ?? "Unassigned"}
                              {item.due_date ? ` · due ${item.due_date}` : ""}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="surface-panel p-5">
                  <h2 className="text-sm font-semibold">Key points</h2>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                    {(data.meeting.summary.key_points ?? []).map((point, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="surface-panel p-5 lg:col-span-2">
                  <h2 className="text-sm font-semibold">Decisions</h2>
                  {data.meeting.summary.decisions?.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-foreground/90">
                      {data.meeting.summary.decisions.map((decision, i) => (
                        <li key={i} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                          {decision}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">No decisions recorded.</p>
                  )}
                </div>
              </div>
            )}

            {data.meeting.segments?.length > 0 && (
              <div className="surface-panel p-5">
                <h2 className="text-sm font-semibold">Transcript</h2>
                <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {data.meeting.segments.map((segment, i) => (
                    <div key={i} className="flex gap-3 px-1 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatTimestamp(segment.start)}
                      </span>
                      <span>
                        <span className="font-medium text-primary">{segment.speaker}: </span>
                        {segment.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
