"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";
import { getUserColor } from "@/utils/getUserColor";
import type { FamilyMember } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { updateMemberRole, removeMember } from "@/features/family/actions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ManageMembersButtonProps {
  members: FamilyMember[];
  familyId: string;
  currentUserId: string;
  isAdmin: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ManageMembersButton — renders the trigger button + the member management modal.
 * Admins can change roles and remove members; non-admins can only view the list.
 */
export function ManageMembersButton({
  members,
  familyId,
  currentUserId,
  isAdmin,
}: ManageMembersButtonProps) {
  const [open, setOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCopyInvite() {
    const text = `Join my family on BuddyDose!\nFamily ID: ${familyId}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  }

  function handleRoleToggle(member: FamilyMember) {
    const newRole = member.role === "admin" ? "member" : "admin";
    setError(null);
    startTransition(async () => {
      const result = await updateMemberRole(familyId, member.user_id, newRole);
      if (!result.success) setError(result.error);
    });
  }

  function handleRemoveConfirm() {
    if (!memberToRemove) return;
    setError(null);
    startTransition(async () => {
      const result = await removeMember(familyId, memberToRemove.user_id);
      if (!result.success) {
        setError(result.error);
      } else {
        setMemberToRemove(null);
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger button */}
      <Button
        id="manage-members-btn"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 rounded-xl px-3 text-xs font-semibold cursor-pointer gap-1.5"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {isAdmin ? "Manage Members" : "View Members"}
      </Button>

      {/* ── Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border-border/40 p-0">

          {/* Header */}
          <DialogHeader className="border-b border-border/40 px-5 pt-5 pb-4">
            <DialogTitle className="text-base font-semibold">
              {isAdmin ? "Manage Members" : "Family Members"}
            </DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""} in this family
            </p>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="overflow-y-auto max-h-[70vh]">

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mx-5 mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* ── Members list ── */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3">
                Members
              </p>

              {members.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                const isAdminMember = member.role === "admin";
                const color = getUserColor(member.user_id);
                const name = member.profile?.full_name ?? (isCurrentUser ? "You" : "Member");

                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-card px-4 py-3 transition-colors"
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        color.bg,
                        color.text
                      )}
                    >
                      {getInitials(name)}
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {name}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <Badge
                        variant={isAdminMember ? "default" : "secondary"}
                        className="mt-0.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0"
                      >
                        {member.role}
                      </Badge>
                    </div>

                    {/* Admin actions — hidden for self */}
                    {isAdmin && !isCurrentUser && (
                      <div className="flex items-center gap-2 shrink-0">

                        {/* Role toggle */}
                        <button
                          type="button"
                          title={isAdminMember ? "Demote to Member" : "Promote to Admin"}
                          disabled={isPending}
                          onClick={() => handleRoleToggle(member)}
                          className={cn(
                            "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50",
                            isAdminMember
                              ? "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                              : "bg-primary/10 hover:bg-primary/20 text-primary"
                          )}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3"
                            aria-hidden="true"
                          >
                            {isAdminMember ? (
                              <>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                              </>
                            ) : (
                              <>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                              </>
                            )}
                          </svg>
                          {isAdminMember ? "Demote" : "Make Admin"}
                        </button>

                        {/* Remove button */}
                        <button
                          type="button"
                          title={`Remove ${name} from family`}
                          disabled={isPending}
                          onClick={() => setMemberToRemove(member)}
                          className="flex size-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="size-3.5"
                            aria-hidden="true"
                          >
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>

                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty — only 1 member (self) */}
              {members.filter((m) => m.user_id !== currentUserId).length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  No other members yet. Share the invite link below!
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border/40 mx-0" />

            {/* ── Invite section ── */}
            <div className="px-5 pt-4 pb-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Invite New Member
              </p>

              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/20 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Family ID
                  </p>
                  <code className="text-xs font-mono text-foreground truncate block select-all">
                    {familyId}
                  </code>
                </div>

                <button
                  type="button"
                  id="copy-invite-btn"
                  onClick={handleCopyInvite}
                  className={cn(
                    "flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-semibold transition-all cursor-pointer shrink-0",
                    copiedInvite
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {copiedInvite ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      Copy Invite
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                Share this Family ID with others. They can join via{" "}
                <span className="font-medium text-muted-foreground">Dashboard → Join Family</span>.
              </p>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove confirmation ── */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(o) => { if (!o) setMemberToRemove(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{memberToRemove?.profile?.full_name ?? "This member"}</strong> will be removed from the family.
              They will lose access to all family medications and the shared schedule.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground focus-visible:ring-destructive/50"
              onClick={(e) => { e.preventDefault(); handleRemoveConfirm(); }}
              disabled={isPending}
            >
              {isPending ? "Removing…" : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
