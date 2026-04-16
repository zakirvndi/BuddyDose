"use client";

import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";
import { getUserColor } from "@/utils/getUserColor";
import type { ChatMessage } from "@/features/family/queries";
import { deleteMessage } from "@/features/family/actions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showName: boolean;
  currentUserId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatMessageItem({
  message,
  isOwnMessage,
  showAvatar,
  showName,
  currentUserId,
}: ChatMessageItemProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletedLocal, setIsDeletedLocal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  async function handleUnsend() {
    setIsDeleting(true);
    setDropdownOpen(false);
    const result = await deleteMessage(message.id);
    if (result.success) setIsDeletedLocal(true);
    setIsDeleting(false);
  }

  const senderName = message.sender?.full_name ?? (isOwnMessage ? "You" : "Member");
  const time = formatTime(message.created_at);
  const isDeleted = message.is_deleted || isDeletedLocal;

  // ── Deleted state ──────────────────────────────────────────────────────────

  if (isDeleted) {
    return (
      <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
        <p className="text-[11px] italic text-muted-foreground/50 px-1">
          Message deleted
        </p>
      </div>
    );
  }

  // ── Own message (right-aligned) ────────────────────────────────────────────

  if (isOwnMessage) {
    return (
      <div className="flex justify-end group">
        <div className="flex items-end gap-1.5 max-w-[75%]">

          {/* Chevron + dropdown — left of bubble */}
          <div ref={dropdownRef} className="relative self-center shrink-0">
            <button
              type="button"
              title="Message options"
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={isDeleting}
              className={cn(
                "flex size-5 items-center justify-center rounded-full transition-all cursor-pointer",
                "bg-secondary/60 hover:bg-secondary text-muted-foreground",
                "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                "disabled:opacity-40"
              )}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                role="menu"
                className={cn(
                  "absolute z-20 top-full mt-1 right-0",
                  "w-36 rounded-xl border border-border/50 bg-popover shadow-lg shadow-black/10",
                  "py-1 overflow-hidden"
                )}
              >
                <button
                  role="menuitem"
                  type="button"
                  onClick={handleUnsend}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M3 12h18M3 6h18M3 18h12" />
                  </svg>
                  {isDeleting ? "Unsending…" : "Unsend"}
                </button>
              </div>
            )}
          </div>

          {/* Bubble + timestamp */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 shadow-sm shadow-primary/10">
              <p className="text-sm text-primary-foreground whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground/60 px-1">{time}</span>
          </div>

        </div>
      </div>
    );
  }

  // ── Other message (left-aligned) ───────────────────────────────────────────

  const color = getUserColor(message.sender_id);

  return (
    <div className="flex items-end gap-2.5">
      {/* Avatar or spacer */}
      {showAvatar ? (
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
            color.bg,
            color.text
          )}
          title={senderName}
        >
          {getInitials(senderName).charAt(0)}
        </div>
      ) : (
        <div className="size-7 shrink-0" aria-hidden="true" />
      )}

      {/* Content */}
      <div className="max-w-[75%] flex flex-col items-start gap-0.5">
        {showName && (
          <span className="text-[11px] font-semibold text-muted-foreground px-1">
            {senderName}
          </span>
        )}
        <div className="rounded-2xl rounded-bl-sm bg-secondary/60 border border-border/30 px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground/60 px-1">{time}</span>
      </div>
    </div>
  );
}
