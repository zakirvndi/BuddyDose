"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getFamiliesForUser } from "@/features/family/queries";
import { shareMedicineToFamily } from "@/features/family/actions";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShareToFamilyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineId: string;
  medicineName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ShareToFamilyModal — lets the user share a personal medicine to one of their
 * family groups. Creates a copy; the original medicine is untouched.
 */
export function ShareToFamilyModal({
  open,
  onOpenChange,
  medicineId,
  medicineName,
}: ShareToFamilyModalProps) {
  const [families, setFamilies] = useState<{ id: string; name: string }[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Reset state and fetch families when modal opens
  useEffect(() => {
    if (!open) {
      setSelectedFamilyId(null);
      setError(null);
      setSuccess(false);
      setFamilies([]);
      return;
    }

    setFetchLoading(true);
    getFamiliesForUser()
      .then((data) => setFamilies(data.map((f) => ({ id: f.id, name: f.name }))))
      .catch(() => setError("Failed to load families."))
      .finally(() => setFetchLoading(false));
  }, [open]);

  function handleShare() {
    if (!selectedFamilyId) return;
    setError(null);

    startTransition(async () => {
      const result = await shareMedicineToFamily(medicineId, selectedFamilyId);
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => onOpenChange(false), 1200);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden rounded-2xl border-border/40 p-0">

        {/* Header */}
        <DialogHeader className="border-b border-border/40 px-5 pt-5 pb-4">
          <DialogTitle className="text-base font-semibold">Share to Family</DialogTitle>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            Share{" "}
            <span className="font-semibold text-foreground">{medicineName}</span>{" "}
            with a family group. A copy will be created — edits to the original
            won&apos;t affect the shared version.
          </p>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 min-h-[120px]">

          {/* Success banner */}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              ✓ Shared successfully! Closing…
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {/* Loading */}
          {fetchLoading && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Empty state */}
          {!fetchLoading && !error && !success && families.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-foreground">No family groups found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Join or create a family group first from your dashboard.
              </p>
            </div>
          )}

          {/* Family list */}
          {!fetchLoading && !success && families.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select a family
              </p>
              {families.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  id={`share-family-${family.id}`}
                  onClick={() => setSelectedFamilyId(family.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer",
                    selectedFamilyId === family.id
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border/40 bg-card hover:border-border/60 hover:bg-secondary/30"
                  )}
                >
                  {/* Family icon */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      selectedFamilyId === family.id
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>

                  <span className="flex-1 font-medium text-sm">{family.name}</span>

                  {/* Selected checkmark */}
                  {selectedFamilyId === family.id && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    >
                      <path d="m20 6-11 11-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 px-5 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            id="share-to-family-submit"
            size="sm"
            className="min-w-[90px] rounded-xl"
            onClick={handleShare}
            disabled={!selectedFamilyId || isPending || success || families.length === 0}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sharing…
              </span>
            ) : (
              "Share"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
