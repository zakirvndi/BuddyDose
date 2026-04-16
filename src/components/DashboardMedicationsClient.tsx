"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddMedicationModal } from "@/components/medicines/AddMedicationModal";
import type { Category } from "@/types";

interface DashboardMedicationsClientProps {
  categories: Category[];
}

/**
 * Thin client wrapper that owns the modal open state for the dashboard.
 * This keeps the dashboard page itself as a Server Component.
 */
export function DashboardMedicationsClient({
  categories,
}: DashboardMedicationsClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        id="dashboard-add-medication-btn"
        size="sm"
        onClick={() => setModalOpen(true)}
        className="h-9 rounded-xl px-4 text-sm font-semibold shadow-sm shadow-primary/20 cursor-pointer"
      >
        + Add Medication
      </Button>

      <AddMedicationModal
        categories={categories}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
