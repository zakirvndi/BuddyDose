"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ReminderSummary } from "@/features/reminder/logic";

interface ReminderBannerProps {
  summary: ReminderSummary;
  /** Session key to persist dismiss state so the banner doesn't reappear on navigation */
  sessionKey?: string;
}

export function ReminderBanner({
  summary,
  sessionKey = "reminder-banner-dismissed",
}: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(true); // Start as true to avoid flash on SSR

  // After mount, check sessionStorage
  useEffect(() => {
    const isDismissed = sessionStorage.getItem(sessionKey) === "1";
    setDismissed(isDismissed);
  }, [sessionKey]);

  if (summary.overdueCount === 0) return null;
  if (dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(sessionKey, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4">
      <Alert className="relative border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 pr-12">
        {/* Dismiss button - Moved to top to avoid Alert's sibling padding selector */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="Dismiss reminder"
          className="absolute right-2 top-2 size-7 !p-0 text-red-600 hover:bg-red-100 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-500/20"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3.5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </Button>

        {/* Warning Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <AlertDescription className="font-medium">
          {summary.overdueCount === 1
            ? "You have 1 overdue medication — please take it as soon as possible."
            : `You have ${summary.overdueCount} overdue medications — please take them as soon as possible.`}
          {summary.upcomingCount > 0 && (
            <span className="ml-1 text-red-700 dark:text-red-400 opacity-80">
              ({summary.upcomingCount} more upcoming today)
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
