"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FamilyCalendar } from "@/components/family/FamilyCalendar";
import { FamilyMedicationsTab } from "@/components/family/FamilyMedicationsTab";
import { FamilyChatTab } from "@/components/family/FamilyChatTab";
import type { FamilyScheduleWithUser, FamilyMedicine, ChatMessage } from "@/features/family/queries";
import type { FamilyMember, Category } from "@/types";

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "schedule" | "medications" | "chat";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "schedule",
    label: "Schedule",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
  {
    id: "medications",
    label: "Medications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface FamilyTabsLayoutProps {
  schedules: FamilyScheduleWithUser[];
  medicines: FamilyMedicine[];
  members: FamilyMember[];
  categories: Category[];
  familyId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FamilyTabsLayout — the client-side tab shell for the family page.
 *
 * Tabs:
 *   • Schedule    — family calendar
 *   • Medications — family medicine list with grouping + management
 *   • Chat        — realtime family chat (always mounted to keep subscription alive)
 */
export function FamilyTabsLayout({
  schedules,
  medicines,
  members,
  categories,
  familyId,
  currentUserId,
  initialMessages,
}: FamilyTabsLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>("schedule");

  return (
    <div>
      {/* ── Tab Bar ── */}
      <div
        role="tablist"
        aria-label="Family sections"
        className="flex gap-1 border-b border-border/50 mb-6"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`family-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 cursor-pointer -mb-px",
                isActive
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border/60"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ── */}

      {/* Schedule — unmount when inactive (no live data needed) */}
      {activeTab === "schedule" && (
        <div role="tabpanel" aria-labelledby="family-tab-schedule">
          <FamilyCalendar
            schedules={schedules}
            familyId={familyId}
            members={members}
          />
        </div>
      )}

      {/* Medications — unmount when inactive */}
      {activeTab === "medications" && (
        <div role="tabpanel" aria-labelledby="family-tab-medications">
          <FamilyMedicationsTab
            medicines={medicines}
            members={members}
            categories={categories}
            familyId={familyId}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* Chat — ALWAYS mounted to keep realtime subscription alive.
          Hidden via CSS when not active so messages accumulate in state. */}
      <div
        role="tabpanel"
        aria-labelledby="family-tab-chat"
        hidden={activeTab !== "chat"}
        aria-hidden={activeTab !== "chat"}
      >
        <FamilyChatTab
          familyId={familyId}
          currentUserId={currentUserId}
          members={members}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
