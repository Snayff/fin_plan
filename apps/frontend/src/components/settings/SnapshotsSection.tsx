import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSnapshots,
  useCreateSnapshot,
  useRenameSnapshot,
  useDeleteSnapshot,
} from "@/hooks/useSettings";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
import { Section } from "./Section";

export function SnapshotsSection() {
  const { data: snapshots = [] } = useSnapshots();
  const createSnapshot = useCreateSnapshot();
  const renameSnapshot = useRenameSnapshot();
  const deleteSnapshot = useDeleteSnapshot();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(snap: { id: string; name: string }) {
    setEditingId(snap.id);
    setEditName(snap.name);
  }

  function handleRename(id: string) {
    renameSnapshot.mutate(
      { id, name: editName },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Snapshot renamed");
        },
        onError: (err: unknown) => {
          const status = (err as any)?.status;
          toast.error(
            status === 409 ? "A snapshot with that name already exists" : "Failed to rename"
          );
        },
      }
    );
  }

  function handleDelete(id: string) {
    deleteSnapshot.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        toast.success("Snapshot deleted");
      },
    });
  }

  return (
    <Section id="snapshots" title="Snapshots">
      {snapshots.length === 0 && (
        <GhostedListEmpty
          ctaText="Save snapshots to track your waterfall over time"
          onCtaClick={() =>
            createSnapshot.mutate(`Snapshot ${format(new Date(), "dd MMM yyyy")}`, {
              onSuccess: () => toast.success("Snapshot saved"),
            })
          }
          ctaButtonLabel="Save snapshot"
        />
      )}
      <div className="space-y-0.5">
        {(snapshots as any[]).map((snap) => (
          <div key={snap.id} className="border-b last:border-b-0 py-2">
            {editingId === snap.id ? (
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  aria-label="Snapshot name"
                />
                <Button
                  size="sm"
                  onClick={() => handleRename(snap.id)}
                  disabled={renameSnapshot.isPending}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            ) : confirmDeleteId === snap.id ? (
              <div className="flex items-center gap-2">
                <p className="text-sm flex-1">Delete &ldquo;{snap.name}&rdquo;?</p>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(snap.id)}
                  disabled={deleteSnapshot.isPending}
                >
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{snap.name}</p>
                  {snap.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(snap.createdAt as string), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => startEdit(snap as { id: string; name: string })}
                  >
                    Rename
                  </button>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setConfirmDeleteId(snap.id as string)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
