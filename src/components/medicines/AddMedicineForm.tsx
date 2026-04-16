"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormInput } from "@/components/ui/FormInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { addMedicineAndSchedules } from "@/features/medicines/actions";
import type { Category } from "@/types";

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily / Variable",
  twice_daily: "Twice Daily",
  three_times_daily: "Three times Daily",
};

interface AddMedicineFormProps {
  categories: Category[];
}

/**
 * AddMedicineForm — Client Component.
 * Submits the form via the server action, then refreshes the page
 * to re-fetch the updated medicines list from the server.
 */
export function AddMedicineForm({ categories }: AddMedicineFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    notes: "",
  });
  const [categoryId, setCategoryId] = useState<string>("");
  const [stockQty, setStockQty] = useState<number>(1);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [freqType, setFreqType] = useState("daily");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessName(null);

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
    const result = await addMedicineAndSchedules(
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

    setSuccessName(form.name);
    setForm({ name: "", dosage: "", notes: "" });
    setCategoryId("");
    setStockQty(1);
    setExpirationDate(undefined);
    setTimes(["08:00"]);
    setFreqType("daily");
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* ── Medicine Name ────────────────────────────────────── */}
          <FormInput
            id="med-name"
            name="name"
            label="Medication name"
            placeholder="e.g. Paracetamol"
            value={form.name}
            onChange={handleChange}
            className="h-11 rounded-2xl cursor-text focus:bg-background"
            required
          />

          {/* ── Dosage ──────────────────────────────────────────── */}
          <FormInput
            id="med-dosage"
            name="dosage"
            label="Dosage"
            placeholder="e.g. 500mg"
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
              <label htmlFor="med-stock" className="text-sm font-medium leading-none">
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
                  id="med-stock"
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

          {/* ── Frequency ───────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-none">
              Frequency
            </label>
            <div className="w-full">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-11 w-full items-center justify-between rounded-2xl border border-input bg-secondary/30 px-4 text-sm font-medium outline-none transition-all hover:bg-secondary/40 hover:text-accent-foreground cursor-pointer focus:ring-4 focus:ring-primary/10">
                  <span>{FREQUENCY_LABELS[freqType] || "Select frequency"}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl p-1.5 shadow-xl border border-border/50">
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer py-2.5 focus:bg-primary/10 focus:text-primary"
                    onClick={() => handleFreqChange("daily")}
                  >
                    Daily / Variable
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer py-2.5 focus:bg-primary/10 focus:text-primary"
                    onClick={() => handleFreqChange("twice_daily")}
                  >
                    Twice Daily
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer py-2.5 focus:bg-primary/10 focus:text-primary"
                    onClick={() => handleFreqChange("three_times_daily")}
                  >
                    Three times Daily
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Schedule Times ───────────────────────────────────── */}
          <div className="flex flex-col gap-2">
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
                        try { (input as any).showPicker(); } catch (_) { }
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
                className="mt-1 h-11 w-full rounded-2xl border-dashed cursor-pointer hover:bg-primary/5 hover:text-primary transition-all"
              >
                + Add another time
              </Button>
            )}
          </div>

          {/* ── Notes ───────────────────────────────────────────── */}
          <FormInput
            id="med-notes"
            name="notes"
            label="Notes (optional)"
            placeholder="e.g. Take with food"
            value={form.notes}
            onChange={handleChange}
            className="h-11 rounded-2xl cursor-pointer focus:bg-background"
          />

          {/* ── Error / Success ──────────────────────────────────── */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {successName && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            >
              ✓ <span className="font-medium">{successName}</span> added successfully!
            </div>
          )}

          <Button
            id="add-medicine-submit"
            type="submit"
            className="mt-2 h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer bg-primary"
            disabled={loading}
          >
            {loading ? "Adding…" : "Add medication"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
