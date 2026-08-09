import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Clock, FileAudio, Loader2, Search, Sparkles, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, formatDuration, type MeetingSummary } from "@/lib/meeting-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your meetings — Hello_Ai" },
      { name: "description", content: "Search, tag and revisit every meeting Hello_Ai has transcribed for you." },
      { property: "og:title", content: "Your meetings — Hello_Ai" },
      { property: "og:description", content: "Your AI-generated meeting recaps and action items in one place." },
    ],
  }),
  component: Dashboard,
});

type MeetingRow = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  duration_seconds: number | null;
  meeting_date: string;
  transcript: string | null;
  summary: MeetingSummary | null;
};

function statusTone(status: string) {
  if (status === "ready") return "bg-success/15 text-success border-success/30";
  if (status === "failed") return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning border-warning/30";
}

function Dashboard() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["meetings"],
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("id, title, status, tags, duration_seconds, meeting_date, transcript, summary")
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MeetingRow[];
    },
  });

  const allTags = useMemo(
    () => Array.from(new Set((data ?? []).flatMap((m) => m.tags))).sort(),
    [data],
  );

  const meetings = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((m) => {
      if (activeTag && !m.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        (m.transcript ?? "").toLowerCase().includes(q) ||
        (m.summary?.overview ?? "").toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [data, query, activeTag]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Your meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every recap Hello_Ai has written for you, searchable to the word.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcripts, titles, tags…"
            className="pl-9"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="size-3.5 text-muted-foreground" />
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeTag === null
                ? "border-primary/40 bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                activeTag === tag
                  ? "border-primary/40 bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="surface-panel flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <FileAudio className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              {data && data.length > 0 ? "No matches" : "No meetings yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data && data.length > 0
                ? "Try a different keyword or clear the tag filter."
                : "Upload a recording or record live — Hello_Ai handles the rest."}
            </p>
          </div>
          <Button asChild>
            <Link to="/new">Add your first meeting</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.id}
              to="/meetings/$id"
              params={{ id: meeting.id }}
              className="surface-panel block p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{meeting.title}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(meeting.meeting_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDuration(meeting.duration_seconds)}
                    </span>
                    {meeting.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-full text-[11px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    statusTone(meeting.status),
                  )}
                >
                  {meeting.status !== "ready" && meeting.status !== "failed" && (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                  {STATUS_LABEL[meeting.status] ?? meeting.status}
                </span>
              </div>
              {meeting.summary?.overview && (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-2">{meeting.summary.overview}</span>
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
