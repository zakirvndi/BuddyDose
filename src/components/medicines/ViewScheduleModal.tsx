"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@/components/ui/timeline";
import { logIntake, markAllTaken } from "@/features/intake/actions";
import { getIntakeLogsForDate } from "@/features/intake/queries";
import {
  getTimePeriod,
  getTimePeriodStyle,
  getEffectiveStatus,
  calculateProgress,
} from "@/features/intake/helpers";
import type { IntakeLog, IntakeStatus } from "@/types";

// ─── Period Icons ─────────────────────────────────────────────────────────────

function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v8" /><path d="m4.93 10.93 1.41 1.41" /><path d="M2 18h2" /><path d="M20 18h2" /><path d="m19.07 10.93-1.41 1.41" /><path d="M22 22H2" /><path d="m8 6 4-4 4 4" /><path d="M16 18a4 4 0 0 0-8 0" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function PillIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" />
    </svg>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

type EffectiveStatus = "taken" | "missed" | "skipped" | "auto-missed" | "pending";

function StatusBadge({ status }: { status: EffectiveStatus }) {
  const config: Record<EffectiveStatus, { label: string; className: string }> = {
    taken: { label: "✓ Taken", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" },
    missed: { label: "✕ Missed", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30" },
    "auto-missed": { label: "⚠ Missed", className: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-500/20" },
    skipped: { label: "— Skipped", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30" },
    pending: { label: "Scheduled", className: "bg-secondary text-muted-foreground border-border/40" },
  };
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ─── Schedule Card ────────────────────────────────────────────────────────────

interface ScheduleCardProps {
  item: any;
  effectiveStatus: EffectiveStatus;
  isPending: boolean;
  onStatusChange: (scheduleId: string, status: IntakeStatus | null) => void;
}

function ScheduleCard({ item, effectiveStatus, isPending, onStatusChange }: ScheduleCardProps) {
  const med = Array.isArray(item.medicine) ? item.medicine[0] : item.medicine;
  const period = getTimePeriod(item.scheduled_time);
  const style = getTimePeriodStyle(period);

  const cardBg =
    effectiveStatus === "taken"
      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5"
      : effectiveStatus === "missed" || effectiveStatus === "auto-missed"
        ? "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/5"
        : effectiveStatus === "skipped"
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5"
          : "border-border/40";

  return (
    <Card className={`shadow-sm transition-all duration-300 ${cardBg} ${isPending ? "opacity-60" : ""}`}>
      <CardContent className="flex items-center gap-3 py-3 px-4">
        {/* Medicine icon */}
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconText}`}>
          <PillIcon className="size-4" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{med?.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{med?.dosage}</p>
        </div>

        {/* Status badge */}
        <StatusBadge status={effectiveStatus} />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Taken */}
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              onStatusChange(
                item.id,
                effectiveStatus === "taken" ? null : "taken"
              )
            }
            title="Mark as taken"
            className={`flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer ${effectiveStatus === "taken"
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                : "bg-secondary/70 text-muted-foreground hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400"
              }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>

          {/* Skipped */}
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              onStatusChange(
                item.id,
                effectiveStatus === "skipped" ? null : "skipped"
              )
            }
            title="Mark as skipped"
            className={`flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer ${effectiveStatus === "skipped"
                ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                : "bg-secondary/70 text-muted-foreground hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-500/20 dark:hover:text-amber-400"
              }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <polyline points="5 4 19 12 5 20 5 4" />
            </svg>
          </button>

          {/* Missed */}
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              onStatusChange(
                item.id,
                effectiveStatus === "missed" ? null : "missed"
              )
            }
            title="Mark as missed"
            className={`flex size-8 items-center justify-center rounded-xl transition-all cursor-pointer ${effectiveStatus === "missed"
                ? "bg-red-500 text-white shadow-sm shadow-red-500/30"
                : "bg-secondary/70 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
              }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ViewScheduleModalProps {
  schedules: any[];
  initialLogs: IntakeLog[];
}

export function ViewScheduleModal({ schedules, initialLogs }: ViewScheduleModalProps) {
  const today = new Date();
  const [date, setDate] = useState<Date | undefined>(today);
  const [logs, setLogs] = useState<IntakeLog[]>(initialLogs);
  // pendingMap: schedule_id → desired status (null = cleared)
  const [pendingMap, setPendingMap] = useState<Map<string, IntakeStatus | null>>(new Map());
  const [isSaving, startSave] = useTransition();
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  // ── Derived data ────────────────────────────────────────────────

  const logsMap = useMemo(
    () => new Map(logs.map((l) => [l.schedule_id, l])),
    [logs]
  );

  const filteredSchedules = useMemo(() => {
    if (!date) return [];
    const sel = new Date(date);
    sel.setHours(0, 0, 0, 0);
    return schedules.filter((s) => {
      const created = new Date(
        Array.isArray(s.medicine)
          ? s.medicine[0]?.created_at
          : s.medicine?.created_at
      );
      created.setHours(0, 0, 0, 0);
      return sel >= created;
    });
  }, [schedules, date]);

  const grouped = useMemo(() => {
    return filteredSchedules.reduce((acc, curr) => {
      const t = curr.scheduled_time.slice(0, 5);
      if (!acc[t]) acc[t] = [];
      acc[t].push(curr);
      return acc;
    }, {} as Record<string, typeof filteredSchedules>);
  }, [filteredSchedules]);

  const sortedTimes = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const scheduleIds = useMemo(
    () => filteredSchedules.map((s) => s.id),
    [filteredSchedules]
  );

  const progress = useMemo(
    () => calculateProgress(scheduleIds, logsMap),
    [scheduleIds, logsMap]
  );

  const hasPendingChanges = pendingMap.size > 0;

  const displayDate = date
    ? date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    : "Select a date";

  function toISODate(d: Date) {
    return d.toISOString().split("T")[0];
  }

  // ── Date change → re-fetch logs ─────────────────────────────────

  async function handleDateChange(newDate: Date | undefined) {
    setDate(newDate);
    setPendingMap(new Map());
    if (!newDate) return;
    setIsFetchingLogs(true);
    try {
      const freshLogs = await getIntakeLogsForDate(toISODate(newDate));
      setLogs(freshLogs);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsFetchingLogs(false);
    }
  }

  // ── Local status change (optimistic) ───────────────────────────

  function handleStatusChange(scheduleId: string, status: IntakeStatus | null) {
    setPendingMap((prev) => {
      const next = new Map(prev);
      if (status === null) {
        // Clear pending
        next.delete(scheduleId);
      } else {
        next.set(scheduleId, status);
      }
      return next;
    });
  }

  // ── Save all pending changes ─────────────────────────────────────

  function handleSave() {
    if (!date || pendingMap.size === 0) return;
    const dateStr = toISODate(date);

    startSave(async () => {
      const entries = Array.from(pendingMap.entries()).filter(
        ([, s]) => s !== null
      ) as [string, IntakeStatus][];

      // Fire all upserts in parallel
      await Promise.all(
        entries.map(([scheduleId, status]) =>
          logIntake(scheduleId, dateStr, status)
        )
      );

      // Refresh logs from server
      const freshLogs = await getIntakeLogsForDate(dateStr);
      setLogs(freshLogs);
      setPendingMap(new Map());
    });
  }

  // ── Mark All Taken ───────────────────────────────────────────────

  function handleMarkAllTaken() {
    if (!date) return;
    const dateStr = toISODate(date);

    // Optimistically set all pending to taken
    const next = new Map<string, IntakeStatus | null>();
    for (const id of scheduleIds) {
      const eff = getEffectiveStatus(id, "", date, logsMap, new Map());
      if (eff !== "taken") next.set(id, "taken");
    }
    setPendingMap(next);

    startSave(async () => {
      await markAllTaken(scheduleIds, dateStr);
      const freshLogs = await getIntakeLogsForDate(dateStr);
      setLogs(freshLogs);
      setPendingMap(new Map());
    });
  }

  // ── Remaining indicator ──────────────────────────────────────────

  const pendingTakenCount = Array.from(pendingMap.values()).filter(
    (s) => s === "taken"
  ).length;
  const localTaken = progress.taken + pendingTakenCount;
  const localRemaining = Math.max(0, progress.total - localTaken - progress.missed - progress.skipped);
  const localPct = progress.total > 0 ? Math.round((localTaken / progress.total) * 100) : 0;

  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-full">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
        View Daily Schedule
      </DialogTrigger>

      <DialogContent className="sm:max-w-[820px] w-[95vw] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh] p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Schedule Calendar
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row items-start gap-8 mt-4">
            {/* ── Left: Calendar ────────────────────────────────── */}
            <div className="shrink-0 flex justify-center md:justify-start">
              <div className="rounded-2xl border bg-card p-1 shadow-sm">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* ── Right: Timeline ───────────────────────────────── */}
            <div className="flex-1 border-t md:border-t-0 pt-6 md:pt-0 md:pl-8 min-w-0">
              {/* Date header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">{displayDate}</h3>
                <p className="text-sm text-muted-foreground">
                  Medications prescribed for this day.
                </p>
              </div>

              {/* Progress + quick actions */}
              {filteredSchedules.length > 0 && (
                <div className="mb-6 space-y-3">
                  {/* Progress bar */}
                  <div className="rounded-2xl border bg-card/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {localTaken} / {progress.total} taken
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {localRemaining > 0
                            ? `${localRemaining} med${localRemaining !== 1 ? "s" : ""} remaining`
                            : localTaken === progress.total
                              ? "All done for today! 🎉"
                              : "Some meds missed or skipped"}
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-primary tabular-nums">
                        {localPct}%
                      </span>
                    </div>
                    <ProgressBar value={localPct} />
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 rounded-xl text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-all cursor-pointer"
                      onClick={handleMarkAllTaken}
                      disabled={isSaving || localTaken === progress.total}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 mr-1.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Mark all taken
                    </Button>

                    {hasPendingChanges && (
                      <Button
                        size="sm"
                        className="flex-1 h-9 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving…" : `Save changes (${pendingMap.size})`}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {sortedTimes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-8 mb-3 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">No medications scheduled.</p>
                </div>
              ) : (
                <div className={`mt-6 ${isFetchingLogs ? "opacity-50 pointer-events-none" : ""}`}>
                  <Timeline>
                    {sortedTimes.map((time, index) => {
                      const timeSchedules = grouped[time];
                      const period = getTimePeriod(time);
                      const style = getTimePeriodStyle(period);
                      const isLast = index === sortedTimes.length - 1;

                      return (
                        <TimelineItem key={time}>
                          <TimelineSeparator>
                            <TimelineDot className={`shadow-sm ${style.dotBg}/20 ring-4 ring-background`}>
                              <div className={`size-2.5 rounded-full ${style.dotBg}`} />
                            </TimelineDot>
                            {!isLast && <TimelineConnector />}
                          </TimelineSeparator>
                          
                          <TimelineContent>
                            <div className="flex items-center gap-2 mb-3 mt-0.5">
                              <span className={`flex size-6 items-center justify-center rounded-lg ${style.iconBg} ${style.iconText}`}>
                                {period === "morning" && <SunriseIcon className="size-3.5" />}
                                {period === "afternoon" && <SunIcon className="size-3.5" />}
                                {period === "night" && <MoonIcon className="size-3.5" />}
                              </span>
                              <h4 className="font-bold tracking-tight text-foreground">{time}</h4>
                              <span className={`text-xs font-medium ${style.iconText} opacity-70`}>{style.label}</span>
                            </div>

                            <div className="flex flex-col gap-3">
                              {timeSchedules.map((item: any) => {
                                const eff = getEffectiveStatus(
                                  item.id,
                                  item.scheduled_time,
                                  date ?? today,
                                  logsMap,
                                  pendingMap
                                );
                                return (
                                  <ScheduleCard
                                    key={item.id}
                                    item={item}
                                    effectiveStatus={eff}
                                    isPending={isSaving}
                                    onStatusChange={handleStatusChange}
                                  />
                                );
                              })}
                            </div>
                          </TimelineContent>
                        </TimelineItem>
                      );
                    })}
                  </Timeline>
                </div>
              )}

              {isFetchingLogs && (
                <div className="flex justify-center py-4">
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
