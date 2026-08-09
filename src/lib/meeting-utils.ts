export type Segment = {
  start: number;
  end?: number;
  speaker: string;
  text: string;
};

export type MeetingSummary = {
  overview: string;
  key_points: string[];
  decisions: string[];
  topics: string[];
};

export type ActionItem = {
  id: string;
  meeting_id: string;
  task: string;
  owner: string | null;
  due_date: string | null;
  done: boolean;
};

export type MeetingStatus = "uploaded" | "transcribing" | "summarizing" | "ready" | "failed";

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 0) return "—";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatTimestamp(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export const STATUS_LABEL: Record<string, string> = {
  uploaded: "Queued",
  transcribing: "Transcribing",
  summarizing: "Summarizing",
  ready: "Ready",
  failed: "Failed",
};
