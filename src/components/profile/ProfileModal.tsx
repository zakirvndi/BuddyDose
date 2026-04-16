"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarUploader } from "./AvatarUploader";
import {
  updateProfile,
  updatePassword,
  uploadAvatar,
} from "@/features/auth/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
  userId: string;
}

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  onSaved?: (updates: { fullName: string; avatarUrl?: string | null }) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProfileModal — edit full name, avatar, and password.
 *
 * Save is disabled if nothing has changed.
 * Overdue status is purely visual — no auto-DB write on missed fields.
 */
export function ProfileModal({
  open,
  onOpenChange,
  profile,
  onSaved,
}: ProfileModalProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset form whenever the modal opens (fresh state, latest profile)
  useEffect(() => {
    if (open) {
      setFullName(profile.fullName ?? "");
      setNewPassword("");
      setConfirmPassword("");
      setPendingFile(null);
      setError(null);
      setSuccessMsg(null);
    }
  }, [open, profile]);

  // Auto-dismiss success banner after 3 s
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Change detection ───────────────────────────────────────────────────────
  const hasNameChange = fullName.trim() !== (profile.fullName ?? "");
  const hasPasswordChange = newPassword.length > 0;
  const hasAvatarChange = pendingFile !== null;
  const hasChanges = hasNameChange || hasPasswordChange || hasAvatarChange;

  // ── Save handler ───────────────────────────────────────────────────────────
  function handleSave() {
    setError(null);

    // Client-side validation
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (hasPasswordChange) {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    startTransition(async () => {
      try {
        let newAvatarUrl: string | null = profile.avatarUrl;

        // Step 1 — upload avatar if a new file was selected
        if (pendingFile) {
          const fd = new FormData();
          fd.append("file", pendingFile);
          const uploadResult = await uploadAvatar(fd);
          if (!uploadResult.success) {
            setError(uploadResult.error);
            return;
          }
          newAvatarUrl = uploadResult.data;
        }

        // Step 2 — update profile row (name / avatar)
        if (hasNameChange || hasAvatarChange) {
          const result = await updateProfile({
            fullName: fullName.trim(),
            ...(newAvatarUrl !== null ? { avatarUrl: newAvatarUrl } : {}),
          });
          if (!result.success) {
            setError(result.error);
            return;
          }
        }

        // Step 3 — update password (optional)
        if (hasPasswordChange) {
          const pwResult = await updatePassword(newPassword);
          if (!pwResult.success) {
            setError(pwResult.error);
            return;
          }
        }

        setSuccessMsg("Profile updated successfully!");
        setPendingFile(null);
        setNewPassword("");
        setConfirmPassword("");
        onSaved?.({ fullName: fullName.trim(), avatarUrl: newAvatarUrl });
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border-border/40 p-0">

        {/* Header */}
        <DialogHeader className="border-b border-border/40 px-6 pt-6 pb-4">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Your Profile
          </DialogTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your personal information and security settings
          </p>
        </DialogHeader>

        {/* Scrollable body */}
        <ScrollArea className="max-h-[72vh]">
          <div className="space-y-5 px-6 py-5">

            {/* ── Feedback banners ─────────────────────────────────────────── */}
            {successMsg && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ✓ {successMsg}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* ── Avatar ───────────────────────────────────────────────────── */}
            <div className="flex justify-center pt-1">
              <AvatarUploader
                currentAvatarUrl={profile.avatarUrl}
                displayName={profile.fullName ?? profile.email}
                onFileSelected={(file) => setPendingFile(file)}
              />
            </div>

            {/* ── Full Name ─────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-full-name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="profile-full-name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl"
                disabled={isPending}
              />
            </div>

            {/* ── Email (read-only) ─────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Email
              </Label>
              <div className="flex h-10 w-full select-all items-center rounded-xl border border-border/40 bg-secondary/30 px-3 text-sm text-muted-foreground">
                {profile.email}
              </div>
            </div>

            {/* ── Change Password ───────────────────────────────────────────── */}
            <div className="space-y-3 rounded-xl border border-border/40 bg-secondary/10 p-4">
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Leave blank to keep your current password.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="new-password"
                  className="text-xs text-muted-foreground"
                >
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="rounded-xl"
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs text-muted-foreground"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="rounded-xl"
                  disabled={isPending}
                />
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* ── Footer actions ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            id="profile-save-btn"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isPending}
            className="min-w-[120px] rounded-xl"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
