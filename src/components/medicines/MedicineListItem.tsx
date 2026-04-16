"use client";

import { useState } from "react";
import type { Medicine, Category } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  updateMedicine,
  deleteMedicine,
} from "@/features/medicines/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/FormInput";
import { formatDate } from "@/utils";
import { ShareToFamilyModal } from "@/components/medicines/ShareToFamilyModal";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily / Variable",
  twice_daily: "Twice Daily",
  three_times_daily: "Three times Daily",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Antibiotik": "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30",
  "Flu & Batuk": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
  "Antinyeri": "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30",
  "Vitamin": "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30",
  "Suplemen": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30",
  "Alergi": "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30",
  "Maag & Lambung": "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30",
  "Lainnya": "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30",
};

function getCategoryColor(name?: string) {
  if (!name) return "bg-secondary text-secondary-foreground border border-border";
  return CATEGORY_COLORS[name] || "bg-secondary text-secondary-foreground border border-border";
}

interface MedicineListItemProps {
  med: Medicine;
  categories: Category[];
}

export function MedicineListItem({ med, categories }: MedicineListItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit Form State
  const initialTimes = med.schedules
    ?.filter((s) => s.is_active)
    .map((s) => s.scheduled_time.slice(0, 5)) || ["08:00"];

  const existFreq = med.schedules?.filter(s => s.is_active)[0]?.frequency || "daily";

  const [times, setTimes] = useState<string[]>(initialTimes);
  const [freqType, setFreqType] = useState(existFreq);

  const [form, setForm] = useState({
    name: med.name,
    dosage: med.dosage,
    notes: med.notes || "",
  });
  const [categoryId, setCategoryId] = useState<string>(med.category_id || "");
  const [stockQty, setStockQty] = useState<number>(med.stock_qty ?? 1);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    med.expiration_date ? new Date(med.expiration_date + "T00:00:00") : undefined
  );
  const [error, setError] = useState<string | null>(null);

  function handleTimeChange(index: number, value: string) {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  }

  function handleFreqChange(type: string) {
    setFreqType(type);
    if (type === "twice_daily") {
      setTimes(["08:00", "13:00"]);
    } else if (type === "three_times_daily") {
      setTimes(["08:00", "13:00", "20:00"]);
    }
  }

  function addTime() {
    setTimes((prev) => [...prev, "12:00"]);
  }

  function removeTime(index: number) {
    if (times.length > 1) {
      setTimes((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.dosage) {
      setError("Name and dosage are required.");
      return;
    }

    const validTimes = times.filter((t) => t.trim() !== "");
    if (validTimes.length === 0) {
      setError("Please add at least one schedule time.");
      return;
    }

    setLoading(true);
    const result = await updateMedicine(
      med.id,
      {
        ...form,
        category_id: categoryId || undefined,
        stock_qty: stockQty,
        expiration_date: expirationDate ? format(expirationDate, "yyyy-MM-dd") : undefined,
      },
      validTimes,
      freqType
    );
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setIsEditOpen(false);
  }

  async function handleDeleteConfirm() {
    setLoading(true);
    const result = await deleteMedicine(med.id);
    setLoading(false);

    if (!result.success) {
      alert("Error deleting medicine: " + result.error);
    }
  }

  // Determine active schedules
  const activeSchedules = med.schedules?.filter((s) => s.is_active) || [];

  return (
    <>
      <Card size="sm" className="relative group">
        <CardContent className="flex items-start justify-between gap-4 py-4 px-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                <path d="m8.5 8.5 7 7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-base leading-snug text-foreground">{med.name}</p>
                {med.category && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getCategoryColor(med.category.name)}`}>
                    {med.category.name.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground mt-0.5">{med.dosage}</p>

              {/* Stock and Expiry details */}
              {(med.stock_qty !== undefined || med.expiration_date) && (
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-medium flex-wrap">
                  {med.stock_qty !== undefined && (
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                      {med.stock_qty} left
                    </span>
                  )}
                  {med.stock_qty !== undefined && med.expiration_date && (
                    <span className="size-1 rounded-full bg-muted-foreground/40" />
                  )}
                  {med.expiration_date && (
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                      Exp: {formatDate(med.expiration_date)}
                    </span>
                  )}
                </div>
              )}

              {/* Schedules rendered as small pills */}
              {activeSchedules.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {activeSchedules.map((sched) => (
                    <span key={sched.id} className="inline-flex items-center rounded-lg bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-medium dark:bg-orange-500/20 dark:text-orange-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="mr-1 size-3">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {sched.scheduled_time.slice(0, 5)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end pt-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider">
                ACTIVE
              </Badge>
              {med.is_private && (
                <button
                  type="button"
                  title="Share to Family"
                  onClick={() => setIsShareOpen(true)}
                  className="flex size-7 items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
                    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                  </svg>
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border border-border/50">
                  <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-accent focus:text-accent-foreground" onClick={() => setIsEditOpen(true)}>
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="rounded-lg cursor-pointer"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete Medicine
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-2 text-xs text-muted-foreground whitespace-nowrap">
              Added {formatDate(med.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>
                Update the details for {med.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <FormInput
                id="edit-med-name"
                name="name"
                label="Medication name"
                value={form.name}
                onChange={handleChange}
                className="h-11 rounded-2xl cursor-text focus:bg-background"
                required
              />
              <FormInput
                id="edit-med-dosage"
                name="dosage"
                label="Dosage"
                value={form.dosage}
                onChange={handleChange}
                className="h-11 rounded-2xl cursor-text focus:bg-background"
                required
              />

              {/* ── Category ─────────────────────────────────────────── */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium leading-none">
                  Category <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="w-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-secondary/30 px-4 text-sm font-medium outline-none transition-all hover:bg-secondary/40 hover:text-accent-foreground cursor-pointer focus:ring-4 focus:ring-primary/10">
                      <span>{categoryId ? categories.find(c => c.id === categoryId)?.name : "Select a category…"}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 rounded-xl p-1.5 shadow-xl border border-border/50">
                      {categories.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No categories found
                        </div>
                      ) : (
                        categories.map((cat, idx) => (
                          <div key={cat.id}>
                            <DropdownMenuItem
                              className="rounded-xl cursor-pointer py-2.5 focus:bg-primary/10 focus:text-primary"
                              onClick={() => setCategoryId(cat.id)}
                            >
                              {cat.name}
                            </DropdownMenuItem>
                            {idx < categories.length - 1 && <DropdownMenuSeparator />}
                          </div>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ── Stock Qty + Expiration Date (side by side) ─────── */}
              <div className="grid grid-cols-2 gap-3">
                {/* Stock Quantity */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="edit-med-stock" className="text-sm font-medium leading-none">
                    Stock qty
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 text-muted-foreground">
                        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <path d="m3.3 7 8.7 5 8.7-5" />
                        <path d="M12 22V12" />
                      </svg>
                    </div>
                    <input
                      id="edit-med-stock"
                      type="number"
                      min={0}
                      value={stockQty}
                      onChange={(e) => setStockQty(Number(e.target.value))}
                      className="flex h-11 w-full rounded-2xl border border-input bg-secondary/30 pl-10 pr-4 py-2 text-sm font-medium transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 focus:bg-background hover:bg-secondary/50"
                    />
                  </div>
                </div>

                {/* Expiration Date */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium leading-none">
                    Expiry <span className="text-muted-foreground font-normal">(opt.)</span>
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex h-11 w-full rounded-2xl border border-input bg-secondary/30 px-4 py-2 text-sm font-medium transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 hover:bg-secondary/50 justify-start text-left items-center cursor-pointer",
                        !expirationDate && "text-muted-foreground"
                      )}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-2 shrink-0">
                        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                      </svg>
                      {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-border/50 shadow-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium leading-none">
                  Frequency
                </label>
                <div className="w-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-secondary/30 px-4 text-sm font-medium outline-none transition-all hover:bg-secondary/40 hover:text-accent-foreground cursor-pointer focus:ring-4 focus:ring-primary/10">
                      <span>{FREQUENCY_LABELS[freqType] || "Select frequency"}</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className="size-4 opacity-50"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl p-1.5 shadow-xl border border-border/50">
                      <DropdownMenuItem
                        className="rounded-lg cursor-pointer py-2.5 focus:bg-accent focus:text-accent-foreground"
                        onClick={() => handleFreqChange("daily")}
                      >
                        Daily / Variable
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-lg cursor-pointer py-2.5 focus:bg-accent focus:text-accent-foreground"
                        onClick={() => handleFreqChange("twice_daily")}
                      >
                        Twice Daily
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-lg cursor-pointer py-2.5 focus:bg-accent focus:text-accent-foreground"
                        onClick={() => handleFreqChange("three_times_daily")}
                      >
                        Three times Daily
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <label className="text-sm font-medium leading-none">
                  Schedule Times
                </label>
                <div className="flex flex-col gap-2">
                  {times.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="relative flex-1 cursor-pointer"
                        onClick={(e) => {
                          const input = e.currentTarget.querySelector("input");
                          if (input && "showPicker" in input) {
                            try { (input as any).showPicker(); } catch (err) { }
                          }
                        }}
                      >
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4 text-muted-foreground">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          className="flex h-11 w-full rounded-2xl border border-input bg-secondary/30 pl-10 pr-4 py-2 text-sm font-medium transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 focus:bg-background appearance-none cursor-pointer hover:bg-secondary/50 [&::-moz-clear]:hidden"
                        />
                      </div>
                      {freqType === "daily" && times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(index)}
                          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                          title="Remove time"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {freqType === "daily" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTime}
                    className="mt-2 h-11 w-full rounded-2xl border-dashed cursor-pointer hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    + Add another time
                  </Button>
                )}
              </div>

              <FormInput
                id="edit-med-notes"
                name="notes"
                label="Notes (optional)"
                value={form.notes}
                onChange={handleChange}
                className="h-11 rounded-2xl cursor-text focus:bg-background"
              />
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-11 rounded-2xl cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-11 rounded-2xl font-bold shadow-md shadow-primary/20 cursor-pointer bg-primary">
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{med.name}</strong> and remove all its scheduled times from your calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:ring-destructive/50"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Medicine"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share to Family Modal */}
      <ShareToFamilyModal
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        medicineId={med.id}
        medicineName={med.name}
      />
    </>
  );
}
