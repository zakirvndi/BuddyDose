import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getFamilyById,
  getFamilySchedulesWithUsers,
  getFamilyMedicines,
  getFamilyMessages,
} from "@/features/family/queries";
import { getCategories } from "@/features/categories/queries";
import { getProfile } from "@/features/auth/queries";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FamilyTabsLayout } from "@/components/family/FamilyTabsLayout";
import { ManageMembersButton } from "@/components/family/ManageMembersModal";
import { UserDropdown } from "@/components/ui/UserDropdown";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Family",
  description: "View and manage medications for your family.",
};

interface FamilyPageProps {
  params: Promise<{ familyId: string }>;
  searchParams: Promise<{ member?: string }>;
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { familyId } = await params;

  // Fetch family details
  const family = await getFamilyById(familyId);
  if (!family) notFound();

  // Verify membership
  const isMember = family.members.some((m) => m.user_id === user.id);
  if (!isMember) redirect("/dashboard");

  // Parallel data fetch
  const [schedules, medicines, categories, profile, initialMessages] = await Promise.all([
    getFamilySchedulesWithUsers(familyId),
    getFamilyMedicines(familyId),
    getCategories(),
    getProfile(),
    getFamilyMessages(familyId),
  ]);

  // Current user's role badge
  const currentMember = family.members.find((m) => m.user_id === user.id);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top Navigation ─────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Back to Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Dashboard
            </Link>
            <span className="text-border/60">|</span>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <span className="font-bold tracking-tight">BuddyDose</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
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

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8">

        {/* ── Family Header ────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{family.name}</h1>
                {currentMember && (
                  <Badge
                    variant={currentMember.role === "admin" ? "default" : "secondary"}
                    className="text-xs font-semibold uppercase tracking-wider"
                  >
                    {currentMember.role}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {family.members.length} {family.members.length === 1 ? "member" : "members"}
              </p>

              {/* Family ID */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Family ID:</span>
                <code className="text-xs bg-secondary/50 border border-border/40 px-2 py-0.5 rounded-lg font-mono select-all">
                  {familyId}
                </code>
              </div>
            </div>

            {/* Manage Members button — visible to everyone, adapts per role */}
            <ManageMembersButton
              members={family.members}
              familyId={familyId}
              currentUserId={user.id}
              isAdmin={currentMember?.role === "admin"}
            />
          </div>
        </section>

        {/* ── Tab Layout (Schedule | Medications | Chat) ─────── */}
        <FamilyTabsLayout
          schedules={schedules}
          medicines={medicines}
          members={family.members}
          categories={categories}
          familyId={familyId}
          currentUserId={user.id}
          initialMessages={initialMessages}
        />

      </main>
    </div>
  );
}
