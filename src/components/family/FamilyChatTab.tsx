"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/features/family/queries";
import type { FamilyMember } from "@/types";
import { sendMessage } from "@/features/family/actions";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatInput } from "./ChatInput";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FamilyChatTabProps {
  familyId: string;
  currentUserId: string;
  members: FamilyMember[];
  initialMessages: ChatMessage[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if this message should show its avatar (first in a consecutive sender group) */
function shouldShowAvatar(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return true;
  return messages[index].sender_id !== messages[index - 1].sender_id;
}

/** Returns true if this message should show the sender's name */
function shouldShowName(messages: ChatMessage[], index: number): boolean {
  return shouldShowAvatar(messages, index);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FamilyChatTab({
  familyId,
  currentUserId,
  members,
  initialMessages,
}: FamilyChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isPending, startTransition] = useTransition();
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Supabase Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`family-chat-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const raw = payload.new as Partial<ChatMessage>;
          if (!raw.id || !raw.content || !raw.sender_id) return;

          setMessages((prev) => {
            // Deduplicate — own messages are appended immediately after sendMessage returns
            if (prev.some((m) => m.id === raw.id)) return prev;

            // Resolve sender profile from members list (avoids extra DB round-trip)
            const member = members.find((m) => m.user_id === raw.sender_id);
            const profile = member?.profile;

            const newMsg: ChatMessage = {
              id: raw.id!,
              family_id: raw.family_id ?? familyId,
              sender_id: raw.sender_id!,
              content: raw.content!,
              is_deleted: false,
              created_at: raw.created_at ?? new Date().toISOString(),
              sender: profile
                ? {
                    id: profile.id,
                    full_name: profile.full_name ?? null,
                    avatar_url: profile.avatar_url ?? null,
                  }
                : null,
            };

            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<ChatMessage>;
          if (!updated.id) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? { ...m, is_deleted: updated.is_deleted ?? m.is_deleted }
                : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [familyId, members]);

  // ── Send handler ──────────────────────────────────────────────────────────
  function handleSend(content: string) {
    setSendError(null);
    startTransition(async () => {
      const result = await sendMessage(familyId, content);
      if (!result.success) {
        setSendError(result.error);
        return;
      }
      // Append own message immediately (realtime will deduplicate)
      setMessages((prev) => {
        if (prev.some((m) => m.id === result.data.id)) return prev;

        // Normalize sender field (may come back as array from Supabase join)
        const rawSender = result.data.sender;
        const sender = Array.isArray(rawSender) ? rawSender[0] : rawSender;

        return [...prev, { ...result.data, sender }];
      });
    });
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden flex flex-col" style={{ height: "600px" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Family Chat</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Member avatars row */}
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => {
            const name = m.profile?.full_name ?? "M";
            return (
              <div
                key={m.user_id}
                title={name}
                className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-bold text-muted-foreground"
              >
                {getInitials(name).charAt(0)}
              </div>
            );
          })}
          {members.length > 5 && (
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[9px] font-bold text-muted-foreground">
              +{members.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-4 space-y-1.5"
      >
        {messages.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-secondary/60 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-8 text-muted-foreground/50">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No messages yet</p>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              Start a conversation with your family
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === currentUserId;
              const showAvatar = !isOwn && shouldShowAvatar(messages, index);
              const showName = !isOwn && shouldShowName(messages, index);
              const prevSenderId = index > 0 ? messages[index - 1].sender_id : null;
              const nextSenderId = index < messages.length - 1 ? messages[index + 1].sender_id : null;
              // Add vertical gap when sender changes
              const gapAbove = index > 0 && prevSenderId !== msg.sender_id;

              return (
                <div key={msg.id} className={cn(gapAbove && "mt-3")}>
                  <ChatMessageItem
                    message={msg}
                    isOwnMessage={isOwn}
                    showAvatar={showAvatar}
                    showName={showName}
                    currentUserId={currentUserId}
                  />
                </div>
              );
            })}
            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* ── Error ── */}
      {sendError && (
        <div
          role="alert"
          className="mx-4 mb-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {sendError}
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border/40 px-4 py-3">
        <ChatInput onSend={handleSend} disabled={isPending} />
      </div>

    </div>
  );
}
