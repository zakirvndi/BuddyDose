"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/ui/FormInput";
import { createFamily, joinFamily } from "@/features/family/actions";

interface FamilySectionClientProps {
  /** When true, renders as small secondary action links instead of the full empty state */
  compact?: boolean;
}

/**
 * FamilySectionClient — handles Create Family and Join Family modals.
 */
export function FamilySectionClient({ compact = false }: FamilySectionClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Create family state
  const [familyName, setFamilyName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join family state
  const [familyId, setFamilyId] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!familyName.trim()) {
      setCreateError("Family name is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    const result = await createFamily(familyName.trim());
    setCreateLoading(false);
    if (!result.success) {
      setCreateError(result.error);
      return;
    }
    setCreateOpen(false);
    setFamilyName("");
    router.refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId.trim()) {
      setJoinError("Family ID is required.");
      return;
    }
    setJoinLoading(true);
    setJoinError(null);
    const result = await joinFamily(familyId.trim());
    setJoinLoading(false);
    if (!result.success) {
      setJoinError(result.error);
      return;
    }
    setJoinOpen(false);
    setFamilyId("");
    router.refresh();
  }

  if (compact) {
    return (
      <div className="flex gap-2 mt-1">
        <Button
          id="family-create-compact-btn"
          variant="outline"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="flex-1 h-9 rounded-xl text-xs border-dashed cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
        >
          + Create another
        </Button>
        <Button
          id="family-join-compact-btn"
          variant="outline"
          size="sm"
          onClick={() => setJoinOpen(true)}
          className="flex-1 h-9 rounded-xl text-xs border-dashed cursor-pointer hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
        >
          + Join family
        </Button>

        <CreateFamilyDialog
          open={createOpen}
          onOpenChange={(v) => { setCreateOpen(v); if (!v) { setFamilyName(""); setCreateError(null); } }}
          familyName={familyName}
          setFamilyName={setFamilyName}
          loading={createLoading}
          error={createError}
          onSubmit={handleCreate}
        />
        <JoinFamilyDialog
          open={joinOpen}
          onOpenChange={(v) => { setJoinOpen(v); if (!v) { setFamilyId(""); setJoinError(null); } }}
          familyId={familyId}
          setFamilyId={setFamilyId}
          loading={joinLoading}
          error={joinError}
          onSubmit={handleJoin}
        />
      </div>
    );
  }

  return (
    <>
      <Card className="border-dashed border-2 bg-transparent shadow-none">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {/* Icon */}
          <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-7"
              aria-hidden="true"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <div>
            <p className="text-base font-semibold">
              You are not in a family yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground max-w-[220px]">
              Create a family group or join an existing one to track medications together.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Button
              id="family-create-btn"
              onClick={() => setCreateOpen(true)}
              className="w-full h-11 rounded-2xl font-semibold shadow-sm shadow-primary/20 cursor-pointer"
            >
              Create Family
            </Button>
            <Button
              id="family-join-btn"
              variant="outline"
              onClick={() => setJoinOpen(true)}
              className="w-full h-11 rounded-2xl font-semibold cursor-pointer hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
            >
              Join Family
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreateFamilyDialog
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); if (!v) { setFamilyName(""); setCreateError(null); } }}
        familyName={familyName}
        setFamilyName={setFamilyName}
        loading={createLoading}
        error={createError}
        onSubmit={handleCreate}
      />
      <JoinFamilyDialog
        open={joinOpen}
        onOpenChange={(v) => { setJoinOpen(v); if (!v) { setFamilyId(""); setJoinError(null); } }}
        familyId={familyId}
        setFamilyId={setFamilyId}
        loading={joinLoading}
        error={joinError}
        onSubmit={handleJoin}
      />
    </>
  );
}

// ── Sub-dialogs ───────────────────────────────────────────────────────────────

function CreateFamilyDialog({
  open, onOpenChange, familyName, setFamilyName, loading, error, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  familyName: string;
  setFamilyName: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Create a Family</DialogTitle>
          <DialogDescription>
            Give your family group a name. You can share the family ID with others so they can join.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
          <FormInput
            id="create-family-name"
            name="family-name"
            label="Family name"
            placeholder="e.g. The Smiths"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="h-11 rounded-2xl cursor-text focus:bg-background"
            required
          />
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            id="create-family-submit"
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-2xl font-bold shadow-sm shadow-primary/20 cursor-pointer bg-primary"
          >
            {loading ? "Creating…" : "Create Family"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinFamilyDialog({
  open, onOpenChange, familyId, setFamilyId, loading, error, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  familyId: string;
  setFamilyId: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Join a Family</DialogTitle>
          <DialogDescription>
            Enter the Family ID shared by your family admin to join their group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mt-2">
          <FormInput
            id="join-family-id"
            name="family-id"
            label="Family ID"
            placeholder="Paste the family ID here"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="h-11 rounded-2xl cursor-text focus:bg-background font-mono text-xs"
            required
          />
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            id="join-family-submit"
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-2xl font-bold shadow-sm shadow-primary/20 cursor-pointer bg-primary"
          >
            {loading ? "Joining…" : "Join Family"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
