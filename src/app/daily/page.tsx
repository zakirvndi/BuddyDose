import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getDailySchedule } from "@/features/medicines/queries";
import { getIntakeLogsForDate } from "@/features/intake/queries";
import { DailyScheduleView } from "@/components/medicines/DailyScheduleView";
import { ReminderBanner } from "@/components/reminder/ReminderBanner";
import { ReminderBadge } from "@/components/reminder/ReminderBadge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { calculateReminderSummary } from "@/features/reminder/logic";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daily Schedule",
  description: "View your daily medication schedule.",
};

export default async function DailySchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const todayIso = new Date().toISOString().split("T")[0];

  const [rawSchedules, todayLogs] = await Promise.all([
    getDailySchedule(),
    getIntakeLogsForDate(todayIso),
  ]);

  const reminderSummary = calculateReminderSummary(rawSchedules, todayLogs, new Date());

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center rounded-xl bg-secondary/50 p-2 text-muted-foreground hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <span className="font-bold tracking-tight text-lg">Daily Routine</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </header>

      {/* ── Reminder Banner ───────────────────────────────────── */}
      <ReminderBanner
        summary={reminderSummary}
        sessionKey="daily-reminder-dismissed"
      />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Today&apos;s Schedule</h1>
          <p className="mt-2 text-muted-foreground">Follow your timeline to stay on track.</p>
          <div className="mt-3">
            <ReminderBadge summary={reminderSummary} />
          </div>
        </section>

        <DailyScheduleView
          schedules={rawSchedules}
          initialLogs={todayLogs}
          todayIso={todayIso}
        />
      </main>
    </div>
  );
}
