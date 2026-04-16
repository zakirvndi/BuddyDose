"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberSelector } from "@/components/MemberSelector";
import { AddMedicationModal } from "@/components/medicines/AddMedicationModal";
import type { FamilyMember, Category } from "@/types";

interface FamilyPageClientProps {
  members: FamilyMember[];
  selectedMemberId: string;
  currentUserId: string;
  familyId: string;
  categories: Category[];
}

/**
 * FamilyPageClient — manages modal open state and member selector for the family page.
 * Kept as a thin client layer; data fetching lives in the server page.
 */
export function FamilyPageClient({
  members,
  selectedMemberId,
  currentUserId,
  familyId,
  categories,
}: FamilyPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* Member Selector */}
      <MemberSelector
        members={members}
        selectedId={selectedMemberId}
        currentUserId={currentUserId}
      />

      {/* Add Medication Button */}
      <Button
        id="family-add-medication-btn"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="h-9 rounded-xl px-4 text-sm font-semibold shadow-sm shadow-primary/20 cursor-pointer"
      >
        + Add Medication
      </Button>

      {/* Modal */}
      <AddMedicationModal
        categories={categories}
        open={modalOpen}
        onOpenChange={setModalOpen}
        familyContext={{ familyId, targetUserId: selectedMemberId }}
      />
    </>
  );
}
