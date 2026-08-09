import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AudioLines,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  Share2,
  Mic,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello_Ai — Never take meeting notes again" },
      {
        name: "description",
        content:
          "Hello_Ai records or ingests your meetings, transcribes them, and generates summaries, decisions and action items automatically.",
      },
      { property: "og:title", content: "Hello_Ai — Never take meeting notes again" },
      {
        property: "og:description",
        content: "AI transcription, summaries, and action items for every meeting. Built for students and small teams.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Mic,
    title: "Record or upload",
    body: "Capture straight from your mic in the browser, or drop in an mp3, mp4 or wav you already have.",
  },
  {
    icon: FileText,
    title: "Timestamped transcript",
    body: "A clean, scrollable transcript with speaker labels, synced to audio playback so you can jump anywhere.",
  },
  {
    icon: Sparkles,
    title: "Summary that reads well",
    body: "Overview, key points and decisions — in concise, detailed, or bullet-only style, your choice.",
  },
  {
    icon: CheckCircle2,
    title: "Action items with owners",
    body: "Every commitment extracted with an owner and due date when it was mentioned, tickable as you go.",
  },
  {
    icon: Search,
    title: "Searchable history",
    body: "Keyword search across every transcript, plus project tags so nothing gets lost after week three.",
  },
  {
    icon: Share2,
    title: "Share and export",
    body: "One link for the recap, or copy a Slack-ready digest to your clipboard in a click.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            AI meeting assistant for students &amp; small teams
          </span>
          <h1 className="mx-auto mt-7 max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-6xl">
            Never take meeting notes again.{" "}
            <span className="text-gradient-brand">Let AI do it for you.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Hello_Ai transcribes your meeting, writes the recap, and pulls out every action item —
            before everyone has left the call.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="glow-ring w-full sm:w-auto" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>

          <div className="surface-panel mx-auto mt-16 max-w-4xl overflow-hidden p-0 text-left">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-warning/70" />
              <span className="size-2.5 rounded-full bg-success/70" />
              <span className="ml-2 text-xs text-muted-foreground">Weekly product sync — 32m</span>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Transcript
                </p>
                {[
                  ["00:04", "Speaker 1", "Let's lock the launch date before we scope anything else."],
                  ["00:19", "Speaker 2", "Design hand-off is done, so the 14th works for us."],
                  ["00:41", "Speaker 3", "I'll own the onboarding copy and have it Friday."],
                ].map(([time, speaker, text]) => (
                  <div key={time} className="rounded-lg bg-surface px-3 py-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-primary">{time}</span>
                      <span className="font-medium text-foreground">{speaker}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Hello_Ai recap
                </p>
                <div className="rounded-lg border border-primary/25 bg-accent/40 px-3 py-2.5">
                  <p className="text-sm">
                    Team confirmed the <span className="text-primary">14th launch date</span> now that
                    design hand-off is complete.
                  </p>
                </div>
                {["Own onboarding copy — Speaker 3, Friday", "Freeze scope after launch date lock"].map(
                  (item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="max-w-lg text-3xl font-semibold sm:text-4xl">
          Everything after the meeting, handled.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-panel p-5 transition-colors hover:border-primary/40">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4.5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="surface-panel glow-ring flex flex-col items-center gap-5 px-6 py-12 text-center">
          <AudioLines className="size-8 text-primary" />
          <h2 className="max-w-md text-3xl font-semibold">Your next meeting can write itself.</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Upload one recording and see the full recap in a couple of minutes.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your free account
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} Hello_Ai. AI-powered meeting notes.</p>
        </div>
      </footer>
    </div>
  );
}
