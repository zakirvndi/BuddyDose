"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/utils";
import { getUserColor } from "@/utils/getUserColor";
import {
  transformScheduleToEvents,
  type CalendarEvent,
} from "@/utils/calendar/transformScheduleToEvents";
import type { FamilyScheduleWithUser } from "@/features/family/queries";
import type { FamilyMember } from "@/types";
import { ScheduleDetailModal } from "./ScheduleDetailModal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FamilyCalendarProps {
  schedules: FamilyScheduleWithUser[];
  familyId: string;
  members: FamilyMember[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_EVENTS = 3;

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyCalendar({ schedules, familyId, members }: FamilyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const memberIds = useMemo(() => members.map((m) => m.user_id), [members]);

  // ── Date math ──────────────────────────────────────────────────────────────

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  /** All calendar cells — may include days from prev/next months to fill weeks */
  const calendarDays = useMemo(() => {
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [monthStart, monthEnd]);

  // ── Events ─────────────────────────────────────────────────────────────────

  /** Generate events for the visible month only — performance: re-runs only when month/schedules change */
  const events = useMemo(
    () => transformScheduleToEvents(schedules, monthStart, monthEnd),
    [schedules, monthStart, monthEnd]
  );

  /** Map dateStr → CalendarEvent[] for O(1) day-cell lookup */
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const arr = map.get(event.date) ?? [];
      arr.push(event);
      map.set(event.date, arr);
    }
    return map;
  }, [events]);

  // ── Interaction ────────────────────────────────────────────────────────────

  const handleDayClick = useCallback(
    (dateStr: string) => {
      const dayEvents = eventsByDate.get(dateStr) ?? [];
      if (dayEvents.length === 0) return;
      setSelectedDate(dateStr);
      setModalOpen(true);
    },
    [eventsByDate]
  );

  const selectedEvents = useMemo(
    () => (selectedDate ? (eventsByDate.get(selectedDate) ?? []) : []),
    [selectedDate, eventsByDate]
  );

  // ── Legend members (only those with schedules this month) ──────────────────

  const activeMemberIds = useMemo(() => {
    const ids = new Set(schedules.map((s) => s.target_user_id));
    return members.filter((m) => ids.has(m.user_id));
  }, [schedules, members]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalDoses = events.length;

  return (
    <div className="space-y-3">
      {/* ── Calendar Card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">

        {/* Month navigation header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalDoses > 0
                ? `${totalDoses} scheduled dose${totalDoses !== 1 ? "s" : ""} this month`
                : "No medications scheduled"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Today button */}
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              Today
            </button>

            {/* Prev month */}
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Next month */}
            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Weekday label row */}
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/10">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/20">
          {calendarDays.map((day, i) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const todayDate = isToday(day);
            const dayEvents = eventsByDate.get(dateStr) ?? [];
            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
            const hiddenCount = dayEvents.length - visibleEvents.length;
            const hasEvents = dayEvents.length > 0;

            return (
              <div
                key={`${dateStr}-${i}`}
                role={hasEvents ? "button" : undefined}
                tabIndex={hasEvents ? 0 : undefined}
                onClick={() => handleDayClick(dateStr)}
                onKeyDown={(e) => {
                  if (hasEvents && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleDayClick(dateStr);
                  }
                }}
                aria-label={hasEvents ? `${format(day, "MMMM d")} — ${dayEvents.length} medication${dayEvents.length !== 1 ? "s" : ""}` : undefined}
                className={cn(
                  "min-h-[90px] p-2 transition-colors select-none",
                  inCurrentMonth ? "bg-card" : "bg-muted/10",
                  todayDate && "bg-primary/[0.04] dark:bg-primary/[0.06]",
                  hasEvents
                    ? "cursor-pointer hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    : "cursor-default"
                )}
              >
                {/* Date number */}
                <div className="flex justify-end mb-1.5">
                  <div
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-semibold leading-none",
                      todayDate
                        ? "bg-primary text-primary-foreground"
                        : inCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/30"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                {/* Event pills */}
                <div className="flex flex-col gap-[3px]">
                  {visibleEvents.map((event) => {
                    const color = getUserColor(event.userId);
                    return (
                      <div
                        key={`${event.scheduleId}-${dateStr}`}
                        className={cn(
                          "flex items-center gap-1 rounded-[5px] px-1.5 py-[3px] overflow-hidden",
                          color.bg
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", color.dot)} />
                        <span className={cn("text-[9px] font-medium leading-none truncate", color.text)}>
                          {event.time} · {event.userName.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}

                  {hiddenCount > 0 && (
                    <div className="text-[9px] font-medium text-muted-foreground pl-1 leading-none">
                      +{hiddenCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Member color legend ─────────────────────────────────────────────── */}
      {activeMemberIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Members
          </span>
          {activeMemberIds.map((member) => {
            const color = getUserColor(member.user_id);
            const name = member.profile?.full_name ?? "Member";
            return (
              <div key={member.user_id} className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", color.dot)} />
                <span className="text-xs text-muted-foreground">
                  {name.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {schedules.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          <p className="font-medium">No medications scheduled yet</p>
          <p className="text-xs mt-1 text-muted-foreground/60">
            Add a medication above to see it appear on the calendar.
          </p>
        </div>
      )}

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      {selectedDate && (
        <ScheduleDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          date={selectedDate}
          events={selectedEvents}
          memberIds={memberIds}
        />
      )}
    </div>
  );
}
