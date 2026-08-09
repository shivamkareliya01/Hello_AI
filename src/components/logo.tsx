import { Link } from "@tanstack/react-router";
import { AudioLines } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:-rotate-6">
        <AudioLines className="size-4.5" strokeWidth={2.5} />
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight">
          Hello<span className="text-primary">_Ai</span>
        </span>
      )}
    </Link>
  );
}
