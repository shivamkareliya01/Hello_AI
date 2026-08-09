import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const processMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { meetingId: string }) => data)
  .handler(async ({ data, context }) => {
    const { runPipeline } = await import("./meetings.server");
    return runPipeline(context.supabase, context.userId, data.meetingId);
  });
