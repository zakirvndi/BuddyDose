"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFamilyIntakeLogsForDate } from "@/features/intake/queries";
import { logFamilyMemberIntake } from "@/features/intake/actions";
import { getUserColor } from "@/utils/getUserColor";
import { getInitials } from "@/utils";
import type { CalendarEvent } from "@/utils/calendar/transformScheduleToEvents";
import type { IntakeLog, IntakeStatus } from "@/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScheduleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  events: CalendarEvent[];
  memberIds: string[];
}

// ─── Status helpers ───────────────────────────────────────────────────────────

type EffectiveStatus = IntakeStatus | "overdue" | "pending";

function getEffectiveStatus(
  scheduleId: string,
  userId: string,
  eventTime: string,
  date: string,
  logsMap: Map<string, IntakeLog>,
  localMap: Map<string, IntakeStatus>
): EffectiveStatus {
  const key = `${scheduleId}_${userId}`;

  // 1. Local optimistic update takes highest priority
  if (localMap.has(key)) return localMap.get(key)!;

  // 2. Persisted DB log
  const log = logsMap.get(key);
  if (log) return log.status;

  // 3. Overdue detection (visual only — no auto DB write)
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  if (date === today) {
    const [h, m] = eventTime.split(":").map(Number);
    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    if (now > scheduled) return "overdue";
  }

  return "pending";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: EffectiveStatus }) {
  const map: Record<EffectiveStatus, { label: string; className: string }> = {
    taken: {
      label: "Taken",
      className:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    },
    missed: {
      label: "Missed",
      className:
        "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20",
    },
    skipped: {
      label: "Skipped",
      className:
        "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20",
    },
    overdue: {
      label: "Overdue",
      className:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    },
    pending: {
      label: "Upcoming",
      className:
        "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    },
  };

  const { label, className } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
        className
      )}
    >
      {label}
    </span>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  isActive: boolean;
  isLoading: boolean;
  label: string;
  title: string;
  activeClassName: string;
}

function ActionButton({
  onClick,
  isActive,
  isLoading,
  label,
  title,
  activeClassName,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      title={title}
      className={cn(
        "h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-40",
        isActive
          ? activeClassName
          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
      )}
    >
      {isLoading ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        label
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScheduleDetailModal({
  open,
  onOpenChange,
  date,
  events,
  memberIds,
}: ScheduleDetailModalProps) {
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  /** Optimistic overrides: `${scheduleId}_${userId}` → IntakeStatus */
  const [localStatus, setLocalStatus] = useState<Map<string, IntakeStatus>>(new Map());
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Fetch intake logs when modal opens or date changes
  useEffect(() => {
    if (!open) {
      setLogs([]);
      setLocalStatus(new Map());
      return;
    }
    setIsLoadingLogs(true);
    getFamilyIntakeLogsForDate(memberIds, date)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setIsLoadingLogs(false));
  }, [open, date]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build logsMap: `${scheduleId}_${userId}` → IntakeLog
  const logsMap = useMemo(() => {
    const map = new Map<string, IntakeLog>();
    for (const log of logs) {
      map.set(`${log.schedule_id}_${log.user_id}`, log);
    }
    return map;
  }, [logs]);

  // Group events by time (sorted ascending)
  const groupedByTime = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const arr = groups.get(event.time) ?? [];
      arr.push(event);
      groups.set(event.time, arr);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  function handleStatusAction(event: CalendarEvent, status: IntakeStatus) {
    const key = `${event.scheduleId}_${event.userId}`;
    setLoadingKey(key + status);

    // Optimistic update
    setLocalStatus((prev) => new Map(prev).set(key, status));

    startTransition(async () => {
      await logFamilyMemberIntake(event.scheduleId, event.userId, date, status);
      setLoadingKey(null);
    });
  }

  const formattedDate = format(parseISO(date), "EEEE, MMMM d, yyyy");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-border/40">

        {/* Modal header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {formattedDate}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {events.length} medication{events.length !== 1 ? "s" : ""} scheduled
          </p>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="max-h-[65vh]">
          <div className="px-5 py-4 space-y-5">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : groupedByTime.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No medications scheduled for this day.
              </p>
            ) : (
              groupedByTime.map(([time, timeEvents]) => (
                <div key={time}>
                  {/* Time group header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="font-mono text-[11px] font-semibold text-muted-foreground bg-secondary/60 px-2 py-1 rounded-md leading-none border border-border/40">
                      {time}
                    </div>
                    <div className="h-px flex-1 bg-border/40" />
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {timeEvents.length} {timeEvents.length === 1 ? "dose" : "doses"}
                    </span>
                  </div>

                  {/* Events in this time group */}
                  <div className="space-y-2">
                    {timeEvents.map((event) => {
                      const key = `${event.scheduleId}_${event.userId}`;
                      const status = getEffectiveStatus(
                        event.scheduleId,
                        event.userId,
                        event.time,
                        date,
                        logsMap,
                        localStatus
                      );
                      const color = getUserColor(event.userId);
                      const firstName = event.userName.split(" ")[0];

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card p-3 hover:border-border/60 transition-colors"
                        >
                          {/* Left: user avatar + medicine info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                color.avatarBg,
                                color.avatarText
                              )}
                            >
                              {getInitials(event.userName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug truncate">
                                {event.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-muted-foreground">{firstName}</span>
                                <StatusPill status={status} />
                              </div>
                            </div>
                          </div>

                          {/* Right: action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <ActionButton
                              onClick={() => handleStatusAction(event, "taken")}
                              isActive={status === "taken"}
                              isLoading={loadingKey === key + "taken"}
                              label="✓"
                              title="Mark as taken"
                              activeClassName="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            />
                            <ActionButton
                              onClick={() => handleStatusAction(event, "missed")}
                              isActive={status === "missed"}
                              isLoading={loadingKey === key + "missed"}
                              label="✕"
                              title="Mark as missed"
                              activeClassName="bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                            />
                            <ActionButton
                              onClick={() => handleStatusAction(event, "skipped")}
                              isActive={status === "skipped"}
                              isLoading={loadingKey === key + "skipped"}
                              label="⏭"
                              title="Mark as skipped"
                              activeClassName="bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
