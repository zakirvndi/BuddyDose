"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";
import { getUserColor } from "@/utils/getUserColor";
import type { FamilyMedicine } from "@/features/family/queries";
import type { FamilyMember, Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddMedicationModal } from "@/components/medicines/AddMedicationModal";
import { FamilyMedicineCard } from "./FamilyMedicineCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Grouping = "member" | "category";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FamilyMedicationsTabProps {
  medicines: FamilyMedicine[];
  members: FamilyMember[];
  categories: Category[];
  familyId: string;
  currentUserId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyMedicationsTab({
  medicines,
  members,
  categories,
  familyId,
  currentUserId,
}: FamilyMedicationsTabProps) {
  const [grouping, setGrouping] = useState<Grouping>("member");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(currentUserId);

  // Resolve display name of selected member
  const selectedMemberName = useMemo(() => {
    const m = members.find((m) => m.user_id === selectedMemberId);
    if (!m) return "Select member";
    const name = m.profile?.full_name ?? "Member";
    return m.user_id === currentUserId
      ? `Me (${name.split(" ")[0]})`
      : name.split(" ")[0];
  }, [selectedMemberId, members, currentUserId]);

  // Helper: resolve target user from a medicine record
  function getTargetInfo(med: FamilyMedicine): { name: string; userId: string } {
    const userId = med.target_user_id ?? "";
    const fromMember = members.find((m) => m.user_id === userId);
    if (fromMember) {
      return { name: fromMember.profile?.full_name ?? "Member", userId };
    }
    const tp = Array.isArray(med.target_profile)
      ? (med.target_profile as any[])[0]
      : med.target_profile;
    return { name: tp?.full_name ?? "Unknown", userId };
  }

  // ── Group by member ──────────────────────────────────────────────────────

  const groupedByMember = useMemo(() => {
    const groups = new Map<
      string,
      { name: string; userId: string; medicines: FamilyMedicine[] }
    >();
    for (const med of medicines) {
      const { name, userId } = getTargetInfo(med);
      if (!groups.has(userId)) {
        groups.set(userId, { name, userId, medicines: [] });
      }
      groups.get(userId)!.medicines.push(med);
    }
    return Array.from(groups.values());
  }, [medicines, members]);

  // ── Group by category ────────────────────────────────────────────────────

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, { name: string; medicines: FamilyMedicine[] }>();
    for (const med of medicines) {
      const catId = med.category_id ?? "uncategorized";
      const catName = med.category?.name ?? "Uncategorized";
      if (!groups.has(catId)) {
        groups.set(catId, { name: catName, medicines: [] });
      }
      groups.get(catId)!.medicines.push(med);
    }
    return Array.from(groups.values());
  }, [medicines]);

  // ── Shared member picker dropdown ─────────────────────────────────────────

  function MemberPicker({ align = "end" }: { align?: "start" | "end" }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-secondary/30 px-3 text-xs font-medium outline-none hover:bg-secondary/50 cursor-pointer transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5 text-muted-foreground">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          {selectedMemberName}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="rounded-xl p-1.5 shadow-xl border border-border/50">
          {members.map((m, idx) => (
            <div key={m.user_id}>
              <DropdownMenuItem
                className={cn(
                  "rounded-lg cursor-pointer py-2.5 focus:bg-primary/10 focus:text-primary",
                  selectedMemberId === m.user_id && "bg-primary/5 text-primary"
                )}
                onClick={() => setSelectedMemberId(m.user_id)}
              >
                {m.user_id === currentUserId
                  ? `Me (${(m.profile?.full_name ?? "Me").split(" ")[0]})`
                  : (m.profile?.full_name ?? "Member")}
              </DropdownMenuItem>
              {idx < members.length - 1 && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-secondary/60 mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-10 text-muted-foreground/50">
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-base mb-1 text-foreground">No medications yet</h3>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
          Start adding medications for family members. They&apos;ll appear here and show up on the schedule calendar.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <MemberPicker align="start" />
          <Button
            id="family-med-empty-add-btn"
            size="sm"
            className="h-9 rounded-xl font-semibold shadow-sm shadow-primary/20"
            onClick={() => setAddModalOpen(true)}
          >
            + Add Medication
          </Button>
        </div>
        <AddMedicationModal
          categories={categories}
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          familyContext={{ familyId, targetUserId: selectedMemberId }}
        />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-base">Family Medications</h2>
          <Badge variant="secondary">
            {medicines.length} medicine{medicines.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Grouping toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/40 bg-card px-3 text-xs font-medium text-muted-foreground outline-none hover:bg-secondary/40 hover:text-foreground cursor-pointer transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              {grouping === "member" ? "By Member" : "By Category"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-1.5 shadow-xl border border-border/50">
              <DropdownMenuItem className="rounded-lg cursor-pointer py-2 focus:bg-primary/10 focus:text-primary" onClick={() => setGrouping("member")}>
                Group by Member
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-lg cursor-pointer py-2 focus:bg-primary/10 focus:text-primary" onClick={() => setGrouping("category")}>
                Group by Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Member selector for add */}
          <MemberPicker />

          {/* Add button */}
          <Button
            id="family-med-add-btn"
            size="sm"
            className="h-9 rounded-xl font-semibold shadow-sm shadow-primary/20"
            onClick={() => setAddModalOpen(true)}
          >
            + Add Medication
          </Button>
        </div>
      </div>

      {/* ── Grouped content ── */}

      {grouping === "member" ? (
        <div className="space-y-8">
          {groupedByMember.map((group) => {
            const color = getUserColor(group.userId);
            return (
              <div key={group.userId}>
                {/* Group header */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/30">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", color.bg, color.text)}>
                    {getInitials(group.name).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.medicines.length} medication{group.medicines.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {/* Cards */}
                <div className="space-y-3">
                  {group.medicines.map((med) => (
                    <FamilyMedicineCard
                      key={med.id}
                      med={med}
                      categories={categories}
                      targetUserName={group.name}
                      targetUserId={group.userId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByCategory.map((group) => (
            <div key={group.name}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/30">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                    <path d="m8.5 8.5 7 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.medicines.length} medication{group.medicines.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {/* Cards */}
              <div className="space-y-3">
                {group.medicines.map((med) => {
                  const { name, userId } = getTargetInfo(med);
                  return (
                    <FamilyMedicineCard
                      key={med.id}
                      med={med}
                      categories={categories}
                      targetUserName={name}
                      targetUserId={userId}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medication Modal */}
      <AddMedicationModal
        categories={categories}
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        familyContext={{ familyId, targetUserId: selectedMemberId }}
      />
    </div>
  );
}
