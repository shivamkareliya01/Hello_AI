import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, Square, UploadCloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processMeeting } from "@/lib/meetings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/meeting-utils";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "New meeting — Hello_Ai" },
      { name: "description", content: "Upload a recording or record live and let Hello_Ai transcribe and summarize it." },
      { property: "og:title", content: "New meeting — Hello_Ai" },
      { property: "og:description", content: "Add a meeting to Hello_Ai for instant AI notes." },
    ],
  }),
  component: NewMeeting,
});

const MAX_BYTES = 24 * 1024 * 1024;

async function probeDuration(file: Blob) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    const done = (value: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0);
    audio.onerror = () => done(0);
    setTimeout(() => done(0), 5000);
  });
}

function NewMeeting() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState<"idle" | "uploading" | "processing">("idle");
  const [progress, setProgress] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 4096) {
          toast.error("That recording was too short. Try again.");
          return;
        }
        setRecordedBlob(blob);
        setFile(null);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access is needed to record.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const source = file ?? recordedBlob;
    if (!source) {
      toast.error("Add a recording first.");
      return;
    }
    if (source.size > MAX_BYTES) {
      toast.error("That file is over 24MB. Please upload a shorter or compressed recording.");
      return;
    }

    setStep("uploading");
    setProgress(15);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expired. Please sign in again.");

      const ext = file ? (file.name.split(".").pop() ?? "webm").toLowerCase() : "webm";
      const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;

      const duration = (await probeDuration(source)) || elapsed;
      setProgress(35);

      const upload = await supabase.storage
        .from("recordings")
        .upload(path, source, { contentType: source.type || "audio/webm" });
      if (upload.error) throw upload.error;
      setProgress(70);

      const { data: meeting, error } = await supabase
        .from("meetings")
        .insert({
          user_id: auth.user.id,
          title: title.trim() || "Untitled meeting",
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          audio_path: path,
          duration_seconds: duration || null,
          status: "uploaded",
        })
        .select("id")
        .single();
      if (error) throw error;

      setProgress(85);
      setStep("processing");
      toast.success("Uploaded. Hello_Ai is listening…");

      processMeeting({ data: { meetingId: meeting.id } }).catch(() => {
        /* status + error are persisted on the meeting row */
      });

      setProgress(100);
      navigate({ to: "/meetings/$id", params: { id: meeting.id } });
    } catch (err) {
      setStep("idle");
      setProgress(0);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  const selectedName = file ? file.name : recordedBlob ? `Live recording (${formatDuration(elapsed)})` : null;
  const busy = step !== "idle";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">New meeting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an mp3, mp4 or wav — or record straight from your microphone.
        </p>
      </div>

      <form className="surface-panel space-y-6 p-6" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="title">Meeting title (optional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave empty and AI will name it"
            disabled={busy}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="product, weekly-sync"
            disabled={busy}
          />
          <p className="text-xs text-muted-foreground">Comma separated — used for filtering later.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center transition-colors hover:border-primary/50">
            <UploadCloud className="size-6 text-primary" />
            <span className="text-sm font-medium">Upload a file</span>
            <span className="text-xs text-muted-foreground">mp3, mp4, wav, m4a — up to 24MB</span>
            <input
              type="file"
              accept="audio/*,video/mp4"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFile(picked);
                setRecordedBlob(null);
              }}
            />
          </label>

          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-8 text-center">
            {recording ? (
              <>
                <div className="flex h-6 items-end gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="animate-pulse-bar w-1 rounded-full bg-primary"
                      style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm">{formatDuration(elapsed)}</span>
                <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                  <Square className="size-3.5" /> Stop
                </Button>
              </>
            ) : (
              <>
                <Mic className="size-6 text-primary" />
                <span className="text-sm font-medium">Record live</span>
                <Button type="button" size="sm" variant="outline" onClick={startRecording} disabled={busy}>
                  Start recording
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedName && (
          <p className="rounded-lg bg-accent/50 px-3 py-2 text-sm">
            Ready to process: <span className="font-medium">{selectedName}</span>
          </p>
        )}

        {busy && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground">
              {step === "uploading" ? "Uploading recording…" : "Handing off to Hello_Ai…"}
            </p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={busy || recording}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Transcribe &amp; summarize
        </Button>
      </form>
    </div>
  );
}
