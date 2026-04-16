"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getInitials } from "@/utils";
import type { FamilyMember } from "@/types";

interface MemberSelectorProps {
  members: FamilyMember[];
  selectedId: string;
  currentUserId: string;
}

/**
 * MemberSelector — renders tab-style buttons for each family member.
 * Updates the URL search param `member` to reflect the selected member.
 */
export function MemberSelector({
  members,
  selectedId,
  currentUserId,
}: MemberSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectMember(userId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("member", userId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      role="tablist"
      aria-label="Select family member"
      className="flex flex-wrap gap-2"
    >
      {members.map((member) => {
        const isSelected = member.user_id === selectedId;
        const isCurrentUser = member.user_id === currentUserId;
        const displayName =
          member.profile?.full_name ||
          (isCurrentUser ? "Me" : `Member`);
        const firstName = displayName.split(" ")[0];

        return (
          <button
            key={member.user_id}
            role="tab"
            aria-selected={isSelected}
            id={`member-tab-${member.user_id}`}
            onClick={() => selectMember(member.user_id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium
              transition-all cursor-pointer border
              ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-secondary/40 text-foreground border-border/40 hover:bg-secondary/70 hover:border-border"
              }
            `}
          >
            {/* Avatar */}
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isSelected
                  ? "bg-white/20 text-white"
                  : isCurrentUser
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {getInitials(displayName)}
            </div>
            <span>
              {isCurrentUser ? `Me (${firstName})` : firstName}
            </span>
            {member.role === "admin" && (
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                admin
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
