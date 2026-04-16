import type { IntakeLog, IntakeStatus } from "@/types";

// ─── Time Period ──────────────────────────────────────────────────────────────

export type TimePeriod = "morning" | "afternoon" | "night";

/**
 * Returns the time period for a given HH:mm or HH:mm:ss string.
 *   Morning   → 05:00 – 11:59
 *   Afternoon → 12:00 – 17:59
 *   Night     → 18:00 – 04:59
 */
export function getTimePeriod(time: string): TimePeriod {
  const [h] = time.split(":").map(Number);
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";
}

export type PeriodStyle = {
  period: TimePeriod;
  label: string;
  /** Tailwind classes for the icon container */
  iconBg: string;
  iconText: string;
  /** Tailwind classes for the timeline dot */
  dotBg: string;
  /** Inline SVG path id for the icon */
  icon: "sunrise" | "sun" | "moon";
};

export function getTimePeriodStyle(period: TimePeriod): PeriodStyle {
  switch (period) {
    case "morning":
      return {
        period,
        label: "Morning",
        iconBg: "bg-amber-100 dark:bg-amber-500/20",
        iconText: "text-amber-600 dark:text-amber-400",
        dotBg: "bg-amber-500",
        icon: "sunrise",
      };
    case "afternoon":
      return {
        period,
        label: "Afternoon",
        iconBg: "bg-sky-100 dark:bg-sky-500/20",
        iconText: "text-sky-600 dark:text-sky-400",
        dotBg: "bg-sky-500",
        icon: "sun",
      };
    case "night":
      return {
        period,
        label: "Night",
        iconBg: "bg-violet-100 dark:bg-violet-500/20",
        iconText: "text-violet-600 dark:text-violet-400",
        dotBg: "bg-violet-500",
        icon: "moon",
      };
  }
}

// ─── Auto-missed detection ────────────────────────────────────────────────────

/**
 * Returns true if the scheduled time has already passed today and
 * there is no existing log for this schedule.
 *
 * @param scheduledTime  HH:mm or HH:mm:ss string from the DB
 * @param selectedDate   The date being viewed (Date object)
 */
export function isAutoMissed(
  scheduledTime: string,
  selectedDate: Date
): boolean {
  const now = new Date();

  // Only auto-miss for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sel = new Date(selectedDate);
  sel.setHours(0, 0, 0, 0);
  if (sel.getTime() !== today.getTime()) return false;

  // Parse the scheduled time into today's date/time
  const [h, m] = scheduledTime.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);

  return now > scheduled;
}

// ─── Progress calculation ─────────────────────────────────────────────────────

export type ProgressResult = {
  total: number;
  taken: number;
  missed: number;
  skipped: number;
  remaining: number;
  percentage: number;
};

/**
 * Calculates intake progress for a set of schedule IDs against a logs map.
 */
export function calculateProgress(
  scheduleIds: string[],
  logsMap: Map<string, IntakeLog>
): ProgressResult {
  const total = scheduleIds.length;
  let taken = 0;
  let missed = 0;
  let skipped = 0;

  for (const id of scheduleIds) {
    const log = logsMap.get(id);
    if (log?.status === "taken") taken++;
    else if (log?.status === "missed") missed++;
    else if (log?.status === "skipped") skipped++;
  }

  const remaining = total - taken - missed - skipped;
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

  return { total, taken, missed, skipped, remaining, percentage };
}

// ─── Effective status (includes auto-missed) ──────────────────────────────────

/**
 * Returns the display status for a schedule item combining the persisted log
 * with the auto-missed visual-only rule.
 *
 * Returns: 'taken' | 'missed' | 'skipped' | 'auto-missed' | 'pending'
 */
export function getEffectiveStatus(
  scheduleId: string,
  scheduledTime: string,
  selectedDate: Date,
  logsMap: Map<string, IntakeLog>,
  pendingMap: Map<string, IntakeStatus | null>
): "taken" | "missed" | "skipped" | "auto-missed" | "pending" {
  // 1. Pending changes take highest priority
  if (pendingMap.has(scheduleId)) {
    const pending = pendingMap.get(scheduleId);
    if (pending === null) {
      // User cleared a log — check auto-missed
      return isAutoMissed(scheduledTime, selectedDate) ? "auto-missed" : "pending";
    }
    return pending as IntakeStatus;
  }

  // 2. Persisted log
  const log = logsMap.get(scheduleId);
  if (log) return log.status;

  // 3. Auto-missed fallback (visual only)
  if (isAutoMissed(scheduledTime, selectedDate)) return "auto-missed";

  return "pending";
}
