import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils";
import type { FamilyGroup, FamilyMember } from "@/types";

interface FamilyCardProps {
  family: FamilyGroup & { members: FamilyMember[] };
  currentUserId: string;
}

export function FamilyCard({ family, currentUserId }: FamilyCardProps) {
  const memberPreview = family.members.slice(0, 4);
  const extraCount = Math.max(0, family.members.length - 4);
  const currentMember = family.members.find((m) => m.user_id === currentUserId);

  return (
    <Card className="border-border/40 hover:border-primary/30 transition-colors">
      <CardContent className="flex flex-col gap-3 py-4 px-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Family icon */}
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <div>
              <p className="font-semibold text-sm leading-snug">{family.name}</p>
              {currentMember && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                  {currentMember.role}
                </span>
              )}
            </div>
          </div>

          <span className="text-xs text-muted-foreground font-medium shrink-0 mt-0.5">
            {family.members.length}{" "}
            {family.members.length === 1 ? "member" : "members"}
          </span>
        </div>

        {/* Member avatars preview */}
        {memberPreview.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {memberPreview.map((member) => {
                const displayName =
                  member.profile?.full_name || member.user_id;
                const isCurrentUser = member.user_id === currentUserId;
                return (
                  <div
                    key={member.id}
                    title={displayName + (isCurrentUser ? " (You)" : "")}
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold ring-0 ${
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {getInitials(displayName)}
                  </div>
                );
              })}
              {extraCount > 0 && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground">
                  +{extraCount}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              {memberPreview
                .slice(0, 2)
                .map((m) => m.profile?.full_name?.split(" ")[0] || "Member")
                .join(", ")}
              {family.members.length > 2 && ` & ${family.members.length - 2} more`}
            </span>
          </div>
        )}

        {/* View button */}
        <Link
          href={`/family/${family.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full rounded-xl h-9 text-sm font-medium cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all justify-center"
          )}
        >
          View Family →
        </Link>
      </CardContent>
    </Card>
  );
}
