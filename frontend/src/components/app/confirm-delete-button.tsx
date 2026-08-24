"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Click-once-to-arm, click-again-to-confirm delete button -- shared by
 * every "past X" list (reports, resumes, ...) so the confirm/deleting/error
 * state lives in one place instead of being re-implemented per list. */
export function ConfirmDeleteButton({
  onDelete,
  onDeleted,
  label,
}: {
  onDelete: () => Promise<void>;
  onDeleted: () => void;
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={confirming ? "destructive" : "ghost"}
        size="icon-sm"
        className="shrink-0"
        disabled={deleting}
        onClick={handleClick}
        onBlur={() => setConfirming(false)}
        aria-label={confirming ? `Confirm ${label}` : label}
      >
        {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </Button>
      {confirming && !deleting && (
        <p className="text-xs font-medium whitespace-nowrap text-destructive">Click again to confirm.</p>
      )}
      {error && <p className="text-xs whitespace-nowrap text-destructive">{error}</p>}
    </div>
  );
}
