"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { logIntake, markAllTaken } from "@/features/intake/actions";
import { getIntakeLogsForDate } from "@/features/intake/queries";
import {
  getTimePeriod,
  getTimePeriodStyle,
  getEffectiveStatus,
  calculateProgress,
} from "@/features/intake/helpers";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@/components/ui/timeline";
import type { IntakeLog, IntakeStatus } from "@/types";

// ─── Icons ─────────────────────────────────────────────────────────────────────

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

// ─── Types ─────────────────────────────────────────────────────────────────────

type EffectiveStatus = "taken" | "missed" | "skipped" | "auto-missed" | "pending";

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Schedule Card ─────────────────────────────────────────────────────────────

interface DailyCardProps {
  item: any;
  effectiveStatus: EffectiveStatus;
  isSaving: boolean;
  onStatusChange: (id: string, status: IntakeStatus | null) => void;
}

function DailyCard({ item, effectiveStatus, isSaving, onStatusChange }: DailyCardProps) {
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
    <Card className={`shadow-sm transition-all duration-300 hover:shadow-md ${cardBg}`}>
      <CardContent className="flex items-center gap-4 py-4 px-5">
        {/* Icon */}
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBg} ${style.iconText}`}>
          <PillIcon className="size-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-snug truncate">{med?.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{med?.dosage}</p>
        </div>

        {/* Status badge — hidden on mobile, shown on sm+ */}
        <div className="hidden sm:block">
          <StatusBadge status={effectiveStatus} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Taken */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onStatusChange(item.id, effectiveStatus === "taken" ? null : "taken")}
            title="Mark as taken"
            className={`flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
              effectiveStatus === "taken"
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
            disabled={isSaving}
            onClick={() => onStatusChange(item.id, effectiveStatus === "skipped" ? null : "skipped")}
            title="Mark as skipped"
            className={`flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
              effectiveStatus === "skipped"
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
            disabled={isSaving}
            onClick={() => onStatusChange(item.id, effectiveStatus === "missed" ? null : "missed")}
            title="Mark as missed"
            className={`flex size-9 items-center justify-center rounded-xl transition-all cursor-pointer ${
              effectiveStatus === "missed"
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

// ─── Main Component ─────────────────────────────────────────────────────────────

interface DailyScheduleViewProps {
  schedules: any[];
  initialLogs: IntakeLog[];
  todayIso: string; // e.g. "2025-04-14"
}

export function DailyScheduleView({
  schedules,
  initialLogs,
  todayIso,
}: DailyScheduleViewProps) {
  const today = new Date();
  const [logs, setLogs] = useState<IntakeLog[]>(initialLogs);
  const [pendingMap, setPendingMap] = useState<Map<string, IntakeStatus | null>>(new Map());
  const [isSaving, startSave] = useTransition();

  const logsMap = useMemo(
    () => new Map(logs.map((l) => [l.schedule_id, l])),
    [logs]
  );

  const grouped = useMemo(() => {
    return schedules.reduce((acc, curr) => {
      const t = curr.scheduled_time.slice(0, 5);
      if (!acc[t]) acc[t] = [];
      acc[t].push(curr);
      return acc;
    }, {} as Record<string, typeof schedules>);
  }, [schedules]);

  const sortedTimes = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const scheduleIds = schedules.map((s) => s.id);
  const progress = useMemo(() => calculateProgress(scheduleIds, logsMap), [scheduleIds, logsMap]);

  const pendingTakenCount = Array.from(pendingMap.values()).filter((s) => s === "taken").length;
  const localTaken = progress.taken + pendingTakenCount;
  const localRemaining = Math.max(0, progress.total - localTaken - progress.missed - progress.skipped);
  const localPct = progress.total > 0 ? Math.round((localTaken / progress.total) * 100) : 0;
  const hasPending = pendingMap.size > 0;

  function handleStatusChange(scheduleId: string, status: IntakeStatus | null) {
    setPendingMap((prev) => {
      const next = new Map(prev);
      if (status === null) {
        next.delete(scheduleId);
      } else {
        next.set(scheduleId, status);
      }
      return next;
    });
  }

  function handleSave() {
    if (pendingMap.size === 0) return;
    startSave(async () => {
      const entries = Array.from(pendingMap.entries()).filter(([, s]) => s !== null) as [string, IntakeStatus][];
      await Promise.all(entries.map(([id, status]) => logIntake(id, todayIso, status)));
      const freshLogs = await getIntakeLogsForDate(todayIso);
      setLogs(freshLogs);
      setPendingMap(new Map());
    });
  }

  function handleMarkAllTaken() {
    // Optimistic
    const next = new Map<string, IntakeStatus | null>();
    for (const id of scheduleIds) {
      const eff = getEffectiveStatus(id, "", today, logsMap, new Map());
      if (eff !== "taken") next.set(id, "taken");
    }
    setPendingMap(next);

    startSave(async () => {
      await markAllTaken(scheduleIds, todayIso);
      const freshLogs = await getIntakeLogsForDate(todayIso);
      setLogs(freshLogs);
      setPendingMap(new Map());
    });
  }

  return (
    <>
      {/* ── Progress header ──────────────────────────────────────────── */}
      {schedules.length > 0 && (
        <div className="mb-8 rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {localTaken} / {progress.total}{" "}
                <span className="text-muted-foreground font-normal text-base">medications taken</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {localRemaining > 0
                  ? `${localRemaining} med${localRemaining !== 1 ? "s" : ""} remaining today`
                  : localTaken === progress.total
                  ? "All done for today! 🎉"
                  : "Some meds missed or skipped"}
              </p>
            </div>
            <span className="text-3xl font-bold text-primary tabular-nums">{localPct}%</span>
          </div>
          <ProgressBar value={localPct} />

          {/* Quick actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 cursor-pointer transition-all"
              onClick={handleMarkAllTaken}
              disabled={isSaving || localTaken === progress.total}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 mr-1.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Mark all as taken
            </Button>

            {hasPending && (
              <Button
                size="sm"
                className="h-9 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </span>
                ) : (
                  `Save changes (${pendingMap.size})`
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      {sortedTimes.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium">Free day!</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                You have no medications scheduled for today.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`mt-6 transition-opacity ${isSaving ? "opacity-60 pointer-events-none" : ""}`}>
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
                      <h4 className="text-xl font-bold tracking-tight text-foreground">{time}</h4>
                      <span className={`text-sm font-medium ${style.iconText} opacity-70`}>{style.label}</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {timeSchedules.map((item: any) => {
                        const eff = getEffectiveStatus(
                          item.id,
                          item.scheduled_time,
                          today,
                          logsMap,
                          pendingMap
                        );
                        return (
                          <DailyCard
                            key={item.id}
                            item={item}
                            effectiveStatus={eff}
                            isSaving={isSaving}
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
    </>
  );
}
