"use client";

import type { ReminderSummary } from "@/features/reminder/logic";

interface ReminderBadgeProps {
  summary: ReminderSummary;
}

export function ReminderBadge({ summary }: ReminderBadgeProps) {
  const { overdueCount, upcomingCount } = summary;
  const hasOverdue = overdueCount > 0;
  const hasUpcoming = upcomingCount > 0;

  if (!hasOverdue && !hasUpcoming) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasOverdue && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          <span
            className="size-1.5 rounded-full bg-red-500 animate-pulse"
            aria-hidden="true"
          />
          {overdueCount} overdue
        </span>
      )}
      {hasUpcoming && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {upcomingCount} remaining
        </span>
      )}
    </div>
  );
}
