import type { IntakeLog } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReminderStatus = "overdue" | "upcoming" | "taken" | "missed" | "skipped";

export type ScheduleWithMedicine = {
  id: string;
  scheduled_time: string; // HH:mm or HH:mm:ss
  medicine?: { name?: string; dosage?: string } | { name?: string; dosage?: string }[];
  [key: string]: unknown;
};

export type ReminderSummary = {
  overdueCount: number;
  upcomingCount: number;
  takenCount: number;
  total: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the given scheduled time (HH:mm or HH:mm:ss) is in the past
 * relative to the provided `now` Date object.
 */
function isTimePast(scheduledTime: string, now: Date): boolean {
  const [h, m] = scheduledTime.split(":").map(Number);
  const scheduled = new Date(now);
  scheduled.setHours(h, m, 0, 0);
  return now > scheduled;
}

/**
 * Returns the effective reminder status for a single schedule entry,
 * combining the persisted intake log with real-time overdue detection.
 *
 * Priority:
 *  1. Persisted log (taken / missed / skipped)
 *  2. No log + time passed → overdue
 *  3. No log + time not yet → upcoming
 */
export function getReminderStatus(
  scheduleId: string,
  scheduledTime: string,
  logsMap: Map<string, IntakeLog>,
  now: Date
): ReminderStatus {
  const log = logsMap.get(scheduleId);
  if (log) return log.status; // 'taken' | 'missed' | 'skipped'
  return isTimePast(scheduledTime, now) ? "overdue" : "upcoming";
}

/**
 * Calculates the full reminder summary for today's schedules.
 *
 * @param schedules   All active schedules for today (from getDailySchedule)
 * @param logs        All intake logs for today (from getIntakeLogsForDate)
 * @param now         Current Date object (allows easy testing with mocked time)
 */
export function calculateReminderSummary(
  schedules: ScheduleWithMedicine[],
  logs: IntakeLog[],
  now: Date
): ReminderSummary {
  const logsMap = new Map<string, IntakeLog>(logs.map((l) => [l.schedule_id, l]));

  let overdueCount = 0;
  let upcomingCount = 0;
  let takenCount = 0;

  for (const schedule of schedules) {
    const status = getReminderStatus(schedule.id, schedule.scheduled_time, logsMap, now);
    if (status === "overdue") overdueCount++;
    else if (status === "upcoming") upcomingCount++;
    else if (status === "taken") takenCount++;
    // missed / skipped are treated as "confirmed" — not shown as actionable
  }

  return {
    overdueCount,
    upcomingCount,
    takenCount,
    total: schedules.length,
  };
}
