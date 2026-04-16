import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getMedicines, getDailySchedule } from "@/features/medicines/queries";
import { getCategories } from "@/features/categories/queries";
import { getIntakeLogsForDate } from "@/features/intake/queries";
import { getProfile } from "@/features/auth/queries";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MedicineListItem } from "@/components/medicines/MedicineListItem";
import { ViewScheduleModal } from "@/components/medicines/ViewScheduleModal";
import { ReminderBanner } from "@/components/reminder/ReminderBanner";
import { ReminderBadge } from "@/components/reminder/ReminderBadge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FamilySection } from "@/components/FamilySection";
import { DashboardMedicationsClient } from "@/components/DashboardMedicationsClient";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { calculateReminderSummary } from "@/features/reminder/logic";
import { formatDate } from "@/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your medications on your BuddyDose dashboard.",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch in parallel for performance
  const todayIso = new Date().toISOString().split("T")[0];
  const [medicines, dailySchedule, categories, todayLogs, profile] =
    await Promise.all([
      getMedicines(),
      getDailySchedule(),
      getCategories(),
      getIntakeLogsForDate(todayIso),
      getProfile(),
    ]);

  // Calculate today's taken count for the stats card
  const takenToday = todayLogs.filter((l) => l.status === "taken").length;
  const totalToday = dailySchedule.length;

  // Reminder summary
  const reminderSummary = calculateReminderSummary(dailySchedule, todayLogs, new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top Navigation ────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight">BuddyDose</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.email}
            </span>
            <ThemeToggle />
            <UserDropdown
              email={user.email ?? ""}
              fullName={profile?.full_name}
              avatarUrl={profile?.avatar_url}
              userId={user.id}
            />
          </div>
        </div>
      </header>

      {/* ── Reminder Banner ────────────────────────────────────── */}
      <ReminderBanner summary={reminderSummary} />

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good day 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s an overview of your current medications.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <ReminderBadge summary={reminderSummary} />
            <ViewScheduleModal schedules={dailySchedule} initialLogs={todayLogs} />
          </div>
        </section>

        {/* Stats Row */}
        <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="border-border/30">
            <CardHeader className="gap-2">
              <CardDescription className="font-medium">Total medications</CardDescription>
              <CardTitle className="text-4xl font-semibold">{medicines.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/30">
            <CardHeader className="gap-2">
              <CardDescription className="font-medium">Taken today</CardDescription>
              <CardTitle className="text-4xl font-semibold">
                {takenToday}
                <span className="text-lg font-normal text-muted-foreground ml-1">
                  / {totalToday}
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-border/30 col-span-2 sm:col-span-1">
            <CardHeader className="gap-2">
              <CardDescription className="font-medium">Adherence rate</CardDescription>
              <CardTitle className="text-4xl font-semibold">
                {totalToday > 0 ? `${Math.round((takenToday / totalToday) * 100)}%` : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ── My Medications ──────────────────────────────────── */}
          <section>
            {/* Section header with Add button */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold">My Medications</h2>
                <Badge variant="secondary">{medicines.length} total</Badge>
              </div>
              {/* Client component that owns modal state */}
              <DashboardMedicationsClient categories={categories} />
            </div>

            {medicines.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-8"
                      aria-hidden="true"
                    >
                      <path d="M4 14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" />
                      <path d="M12 12V4" />
                      <path d="M8 8h8" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium">Your cabinet is empty</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Let&apos;s start by adding your first medication. Your schedule will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {medicines.map((med) => (
                  <MedicineListItem key={med.id} med={med} categories={categories} />
                ))}
              </div>
            )}
          </section>

          {/* ── Your Family ─────────────────────────────────────── */}
          <FamilySection currentUserId={user.id} />
        </div>
      </main>
    </div>
  );
}
