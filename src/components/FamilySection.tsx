import { getFamiliesForUser } from "@/features/family/queries";
import { FamilyCard } from "@/components/FamilyCard";
import { FamilySectionClient } from "@/components/FamilySectionClient";

interface FamilySectionProps {
  currentUserId: string;
}

/**
 * FamilySection — Server Component.
 * Fetches family data and delegates empty-state UI actions to the client.
 */
export async function FamilySection({ currentUserId }: FamilySectionProps) {
  const families = await getFamiliesForUser();

  return (
    <section>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Your Family</h2>
        {families.length > 0 && (
          <span className="text-xs text-muted-foreground font-medium">
            {families.length} {families.length === 1 ? "family" : "families"}
          </span>
        )}
      </div>

      {families.length === 0 ? (
        /* ── Empty State ─────────────────────────────────────── */
        <FamilySectionClient />
      ) : (
        /* ── Family Cards ────────────────────────────────────── */
        <div className="flex flex-col gap-3">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              currentUserId={currentUserId}
            />
          ))}
          {/* Allow creating another family or joining */}
          <FamilySectionClient compact />
        </div>
      )}
    </section>
  );
}
