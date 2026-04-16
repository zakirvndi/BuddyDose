"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarUploaderProps {
  /** Currently saved avatar URL (from DB). */
  currentAvatarUrl: string | null;
  /** Used as initials fallback when no avatar exists. */
  displayName: string;
  /** Called when the user picks a new file. Parent uses this to track pending state. */
  onFileSelected: (file: File) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AvatarUploader — circular avatar with an overlaid camera button.
 * Shows a local preview immediately after file selection.
 * The actual upload is handled by the parent on Save.
 */
export function AvatarUploader({
  currentAvatarUrl,
  displayName,
  onFileSelected,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous preview to avoid memory leaks
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelected(file);
  }

  const displayUrl = previewUrl ?? currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar circle */}
      <div className="relative">
        <div
          className={cn(
            "size-20 rounded-full overflow-hidden flex items-center justify-center",
            "border-4 border-background ring-2 ring-border/40",
            "bg-primary/10"
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-primary select-none">
              {getInitials(displayName || "U")}
            </span>
          )}
        </div>

        {/* Camera overlay button */}
        <label
          htmlFor="avatar-file-input"
          title="Change photo"
          className={cn(
            "absolute bottom-0 right-0 flex size-7 cursor-pointer items-center justify-center",
            "rounded-full bg-primary text-primary-foreground shadow-sm",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          {/* Camera icon */}
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
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </label>
      </div>

      <input
        id="avatar-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />

      {previewUrl && (
        <p className="text-xs text-muted-foreground">
          New photo selected — save to apply
        </p>
      )}
    </div>
  );
}
