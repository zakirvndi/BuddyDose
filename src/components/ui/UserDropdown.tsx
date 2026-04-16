"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/features/auth/actions";
import { getInitials } from "@/utils";
import { cn } from "@/lib/utils";
import { ProfileModal } from "@/components/profile/ProfileModal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserDropdownProps {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  userId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * UserDropdown — clickable avatar in the app header.
 * Uses @base-ui/react/menu (no Radix asChild prop).
 * Manages local state for name/avatar so the header updates
 * immediately after profile save (before router.refresh() completes).
 */
export function UserDropdown({
  email,
  fullName: initialFullName,
  avatarUrl: initialAvatarUrl,
  userId,
}: UserDropdownProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  // Local state mirrors server props — updated optimistically after save
  const [localFullName, setLocalFullName] = useState<string | null>(
    initialFullName ?? null
  );
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(
    initialAvatarUrl ?? null
  );

  const displayName = localFullName ?? email;
  const initials = getInitials(displayName);

  function handleProfileSaved(updates: {
    fullName: string;
    avatarUrl?: string | null;
  }) {
    setLocalFullName(updates.fullName);
    if (updates.avatarUrl !== undefined) setLocalAvatarUrl(updates.avatarUrl);
    // Re-fetch server component data in the background
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        {/* ── Trigger: styled avatar button ─────────────────────────────── */}
        <DropdownMenuTrigger
          id="user-avatar-btn"
          aria-label="Open user menu"
          className={cn(
            "relative flex size-9 shrink-0 cursor-pointer items-center",
            "justify-center overflow-hidden rounded-full",
            "ring-2 ring-border/40 hover:ring-primary/40",
            "transition-all focus-visible:outline-none focus-visible:ring-primary/60 bg-transparent border-0 p-0"
          )}
        >
          {localAvatarUrl ? (
            <img
              src={localAvatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-primary/10 text-[11px] font-semibold text-primary">
              {initials}
            </span>
          )}
        </DropdownMenuTrigger>

        {/* ── Dropdown content ──────────────────────────────────────────── */}
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
          {/* User identity header — plain div, not GroupLabel (base-ui requires Group context) */}
          <div className="px-2.5 py-2 border-b border-border/40 mb-1">
            <p className="text-sm font-semibold leading-none truncate">
              {localFullName ?? "User"}
            </p>
            <p className="mt-0.5 text-xs font-normal text-muted-foreground truncate">
              {email}
            </p>
          </div>

          {/* Profile */}
          <DropdownMenuItem
            id="dropdown-profile-item"
            className="rounded-lg cursor-pointer gap-2 px-2.5 py-2"
            onClick={() => setProfileOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span className="text-muted-foreground">Profile</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign out */}
          <DropdownMenuItem
            id="dropdown-sign-out-item"
            variant="destructive"
            className="rounded-lg cursor-pointer gap-2 px-2.5 py-2"
            onClick={async () => {
              await signOut();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile modal — rendered outside DropdownMenu to avoid z-index issues */}
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={{
          fullName: localFullName,
          avatarUrl: localAvatarUrl,
          email,
          userId,
        }}
        onSaved={handleProfileSaved}
      />
    </>
  );
}
