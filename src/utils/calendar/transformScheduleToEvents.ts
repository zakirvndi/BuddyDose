import { eachDayOfInterval, format, parseISO } from "date-fns";
import type { FamilyScheduleWithUser } from "@/features/family/queries";

// ─── Calendar Event ───────────────────────────────────────────────────────────

export type CalendarEvent = {
  /** ISO date string: YYYY-MM-DD */
  date: string;
  /** Medicine name — used as the event title */
  title: string;
  /** HH:mm display time */
  time: string;
  userId: string;
  userName: string;
  scheduleId: string;
  medicineId: string;
};

// ─── Transform ────────────────────────────────────────────────────────────────

/**
 * Expands a flat list of recurring schedules into individual CalendarEvent
 * entries for every day within the given date range.
 *
 * Date-range rules applied per schedule:
 *   • Skip day if dayStr < schedule.start_date
 *   • Skip day if schedule.end_date exists AND dayStr > schedule.end_date
 *
 * Performance note: call this inside useMemo and only regenerate when the
 * visible month changes.
 *
 * @param schedules   Flat schedule list from getFamilySchedulesWithUsers()
 * @param monthStart  First day of the visible month (Date object)
 * @param monthEnd    Last day of the visible month (Date object)
 */
export function transformScheduleToEvents(
  schedules: FamilyScheduleWithUser[],
  monthStart: Date,
  monthEnd: Date
): CalendarEvent[] {
  if (schedules.length === 0) return [];

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const events: CalendarEvent[] = [];

  for (const schedule of schedules) {
    // HH:mm — strip seconds if present
    const time = schedule.scheduled_time.substring(0, 5);

    for (const day of days) {
      const dayStr = format(day, "yyyy-MM-dd");

      // ── Date-range filter ─────────────────────────────────────────────────
      // Skip days before the schedule start date
      if (dayStr < schedule.start_date) continue;
      // Skip days after the schedule end date (if set)
      if (schedule.end_date && dayStr > schedule.end_date) continue;

      events.push({
        date: dayStr,
        title: schedule.medicine_name,
        time,
        userId: schedule.target_user_id,
        userName: schedule.user_name,
        scheduleId: schedule.schedule_id,
        medicineId: schedule.medicine_id,
      });
    }
  }

  // Sort by date then time so event pills appear in chronological order
  events.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    return dateCmp !== 0 ? dateCmp : a.time.localeCompare(b.time);
  });

  return events;
}

/**
 * Returns all CalendarEvents whose date matches the given ISO date string.
 * Pre-sorted by time (inherits order from transformScheduleToEvents).
 */
export function getEventsForDate(
  events: CalendarEvent[],
  date: string
): CalendarEvent[] {
  return events.filter((e) => e.date === date);
}
