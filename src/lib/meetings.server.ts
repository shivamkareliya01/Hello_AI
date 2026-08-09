import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const STYLE_HINT: Record<string, string> = {
  concise: "Keep the overview to 2-3 tight sentences. Key points short and scannable.",
  detailed: "Write a thorough overview (5-8 sentences) with context and nuance.",
  bullets: "Overview must be a single sentence. Everything else as short bullets.",
};

function extension(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "webm";
  return ["mp3", "mp4", "wav", "m4a", "webm", "ogg", "mpeg", "mpga"].includes(ext) ? ext : "webm";
}

async function transcribe(file: Blob, filename: string, apiKey: string) {
  const form = new FormData();
  form.append("model", "openai/gpt-4o-mini-transcribe");
  form.append("file", file, filename);

  const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}). ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { text?: string };
  const text = (json.text ?? "").trim();
  if (!text) throw new Error("The recording produced an empty transcript. Try a clearer recording.");
  return text;
}

type Analysis = {
  title: string;
  segments: { start: number; speaker: string; text: string }[];
  summary: { overview: string; key_points: string[]; decisions: string[]; topics: string[] };
  action_items: { task: string; owner?: string | null; due_date?: string | null }[];
};

async function analyze(
  transcript: string,
  durationSeconds: number,
  style: string,
  apiKey: string,
): Promise<Analysis> {
  const system = [
    "You are Hello_Ai, a meeting analyst. You receive a raw meeting transcript with no speaker labels.",
    "Split it into speaker-labeled segments (Speaker 1, Speaker 2, ...) using conversational cues; if it is clearly one voice, use Speaker 1 throughout.",
    `The recording is about ${Math.round(durationSeconds)} seconds long. Spread segment start times (in seconds) evenly and monotonically across that duration.`,
    STYLE_HINT[style] ?? STYLE_HINT["concise"],
    "Reply with ONLY valid JSON matching this shape:",
    '{"title":string,"segments":[{"start":number,"speaker":string,"text":string}],"summary":{"overview":string,"key_points":string[],"decisions":string[],"topics":string[]},"action_items":[{"task":string,"owner":string|null,"due_date":string|null}]}',
    "title: a short descriptive meeting title (max 8 words). topics: 3-6 short keyword topics. owner/due_date only when stated or clearly implied, else null.",
  ].join("\n");

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: transcript.slice(0, 120000) },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is rate limited right now. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Add credits to keep summarizing.");
    throw new Error(`Summarization failed (${res.status}). ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: Analysis;
  try {
    parsed = JSON.parse(cleaned) as Analysis;
  } catch {
    throw new Error("AI returned an unreadable summary. Please retry processing.");
  }
  return {
    title: parsed.title || "Untitled meeting",
    segments: Array.isArray(parsed.segments) ? parsed.segments : [],
    summary: {
      overview: parsed.summary?.overview ?? "",
      key_points: parsed.summary?.key_points ?? [],
      decisions: parsed.summary?.decisions ?? [],
      topics: parsed.summary?.topics ?? [],
    },
    action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
  };
}

export async function runPipeline(supabase: Client, userId: string, meetingId: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, audio_path, duration_seconds, title")
    .eq("id", meetingId)
    .single();
  if (error || !meeting) throw new Error("Meeting not found.");
  if (!meeting.audio_path) throw new Error("This meeting has no recording attached.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("summary_style")
    .eq("id", userId)
    .maybeSingle();
  const style = profile?.summary_style ?? "concise";

  try {
    await supabase.from("meetings").update({ status: "transcribing", error_message: null }).eq("id", meetingId);

    const download = await supabase.storage.from("recordings").download(meeting.audio_path);
    if (download.error || !download.data) throw new Error("Could not read the uploaded recording.");

    const transcript = await transcribe(
      download.data,
      `recording.${extension(meeting.audio_path)}`,
      apiKey,
    );

    await supabase.from("meetings").update({ status: "summarizing", transcript }).eq("id", meetingId);

    const analysis = await analyze(transcript, meeting.duration_seconds ?? 600, style, apiKey);

    await supabase
      .from("meetings")
      .update({
        status: "ready",
        transcript,
        segments: analysis.segments,
        summary: analysis.summary,
        title:
          meeting.title && meeting.title !== "Untitled meeting" ? meeting.title : analysis.title,
      })
      .eq("id", meetingId);

    await supabase.from("action_items").delete().eq("meeting_id", meetingId);
    if (analysis.action_items.length > 0) {
      await supabase.from("action_items").insert(
        analysis.action_items.slice(0, 40).map((item) => ({
          meeting_id: meetingId,
          user_id: userId,
          task: item.task,
          owner: item.owner ?? null,
          due_date: item.due_date ?? null,
        })),
      );
    }

    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    await supabase.from("meetings").update({ status: "failed", error_message: message }).eq("id", meetingId);
    throw new Error(message);
  }
}
