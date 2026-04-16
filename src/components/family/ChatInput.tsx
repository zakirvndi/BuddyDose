"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  function handleSubmit() {
    const el = textareaRef.current;
    if (!el) return;
    const trimmed = el.value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    el.value = "";
    el.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex items-end gap-2.5">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id="chat-message-input"
        rows={1}
        placeholder="Send a message…"
        disabled={disabled}
        onInput={autoResize}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex-1 resize-none rounded-2xl border border-input bg-secondary/30 px-4 py-2.5",
          "text-sm leading-relaxed outline-none transition-all",
          "placeholder:text-muted-foreground/60",
          "focus-visible:border-primary focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/10",
          "hover:bg-secondary/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "max-h-[140px] overflow-y-auto"
        )}
        aria-label="Message input"
      />

      {/* Send button */}
      <button
        type="button"
        id="chat-send-btn"
        onClick={handleSubmit}
        disabled={disabled}
        title="Send message (Enter)"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-2xl transition-all cursor-pointer",
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 translate-x-[1px]"
          aria-hidden="true"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      </button>
    </div>
  );
}
