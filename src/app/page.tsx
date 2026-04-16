import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "BuddyDose — Medication Management Made Simple",
  description:
    "Track medications, share schedules with family, and never miss a dose. BuddyDose keeps your health on track — together.",
};

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
    title: "Personal Medication Tracking",
    desc: "Organize all your medications with custom dosages, schedules, and expiry tracking. Everything in one clean dashboard.",
  },
  {
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-blue-200/60 dark:border-blue-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Family Mode",
    desc: "Invite family members and manage medications for everyone in one place. Assign, track, and share schedules with ease.",
  },
  {
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    border: "border-violet-200/60 dark:border-violet-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    ),
    title: "Visual Calendar",
    desc: "See your entire medication schedule at a glance. Color-coded by family member so nothing gets missed.",
  },
  {
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    border: "border-orange-200/60 dark:border-orange-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Family Chat",
    desc: "Communicate with family members in real-time about medications, health updates, and reminders — all in one place.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Authenticated users go straight to the dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ════════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-all group-hover:shadow-md group-hover:shadow-primary/40 group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">BuddyDose</span>
          </Link>

          {/* Nav CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 items-center rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="relative flex-1 overflow-hidden px-6 py-20 sm:py-32">

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-32 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute left-0 top-40 h-[200px] w-[200px] rounded-full bg-violet-500/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Medication Management, Simplified
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Never miss a{" "}
            <span className="text-primary">dose</span>{" "}
            again
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            BuddyDose helps you track medications, manage family health schedules,
            and stay coordinated — all in one clean, easy-to-use app.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              id="hero-get-started"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
            >
              Get Started Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/login"
              id="hero-sign-in"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-border bg-card px-8 text-base font-semibold text-foreground hover:bg-secondary/60 transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Social proof / trust line */}
          <p className="mt-8 text-xs text-muted-foreground/60 font-medium">
            Free to use · No credit card required · Family-friendly
          </p>
        </div>

        {/* ── Preview cards ── */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Preview card: medicine */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
                    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Amoxicillin</p>
                  <p className="text-[10px] text-muted-foreground">500mg · Daily</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["08:00", "14:00", "20:00"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 text-[10px] font-medium">
                    <span className="size-1.5 rounded-full bg-orange-500" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Preview card: family */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">Family · 3 members</p>
              <div className="space-y-2">
                {[
                  { name: "Zaki", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
                  { name: "Sarah", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
                  { name: "Andi", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-2">
                    <div className={`size-5 rounded-full flex items-center justify-center text-[9px] font-bold ${m.color}`}>
                      {m.name[0]}
                    </div>
                    <span className="text-xs font-medium text-foreground">{m.name}</span>
                    <div className={`ml-auto size-1.5 rounded-full ${m.dot}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card: schedule */}
            <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">Today · 3 doses</p>
              <div className="space-y-2">
                {[
                  { time: "08:00", name: "Vitamin C", done: true },
                  { time: "13:00", name: "Amoxicillin", done: true },
                  { time: "20:00", name: "Paracetamol", done: false },
                ].map((item) => (
                  <div key={item.time} className="flex items-center gap-2">
                    <div className={`size-4 rounded-full border-2 flex items-center justify-center ${item.done ? "bg-primary border-primary" : "border-border"}`}>
                      {item.done && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="size-2.5"><path d="m20 6-11 11-5-5" /></svg>
                      )}
                    </div>
                    <span className={`text-xs ${item.done ? "text-muted-foreground line-through" : "text-foreground font-medium"}`}>{item.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════════════ */}
      <section className="bg-secondary/20 border-y border-border/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">

          {/* Section header */}
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Everything you need to stay on track
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From personal reminders to family-wide management — BuddyDose has every tool you need to manage health together.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5 ${f.border}`}
              >
                <div className={`inline-flex size-11 items-center justify-center rounded-2xl mb-4 ${f.color} bg-opacity-10`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm text-foreground mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 text-center">
            <Link
              href="/register"
              id="features-cta"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-10 text-base font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
            >
              Start for Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground/60">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-4">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo + tagline */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-none">BuddyDose</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Stay healthy, together.</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors font-medium">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors font-medium">Register</Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} BuddyDose
          </p>
        </div>
      </footer>

    </div>
  );
}
