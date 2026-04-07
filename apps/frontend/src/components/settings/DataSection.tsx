import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useExportHousehold, useImportHousehold, useValidateImport } from "@/hooks/useExportImport";
import { Section } from "./Section";
import { ImportDestinationDialog } from "./ImportDestinationDialog";

export function DataSection() {
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportData, setPendingImportData] = useState<unknown>(null);
  const [showDestination, setShowDestination] = useState(false);

  const exportMutation = useExportHousehold();
  const validateMutation = useValidateImport();
  const importMutation = useImportHousehold();

  function handleExport() {
    if (!householdId) return;
    exportMutation.mutate(householdId, {
      onSuccess: () => toast.success("Export downloaded"),
      onError: (err: Error) => toast.error(`Export failed: ${err.message}`),
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so the same file can be picked again

    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      toast.error("Could not read JSON file");
      return;
    }

    validateMutation.mutate(parsed, {
      onSuccess: (result) => {
        if (!result.valid) {
          toast.error(result.errors?.[0] ?? "Invalid import file");
          return;
        }
        setPendingImportData(parsed);
        setShowDestination(true);
      },
      onError: (err: Error) => toast.error(`Validation failed: ${err.message}`),
    });
  }

  function handleConfirmImport(mode: "overwrite" | "create_new") {
    if (!pendingImportData || !householdId) return;
    importMutation.mutate(
      { householdId, data: pendingImportData, mode },
      {
        onSuccess: () => {
          toast.success(
            mode === "create_new" ? "New household created from import" : "Household data imported"
          );
          setShowDestination(false);
          setPendingImportData(null);
        },
        onError: (err: Error) => {
          toast.error(`Import failed: ${err.message}`);
          setShowDestination(false);
        },
      }
    );
  }

  return (
    <Section id="data" title="Data">
      <p className="text-sm text-muted-foreground">
        Back up your household data or restore from a previous export.
      </p>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-md border p-4">
          <div>
            <h3 className="text-sm font-medium">Export</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Download a JSON backup of all data in this household.
            </p>
          </div>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="h-3.5 w-3.5 mr-2" />
            {exportMutation.isPending ? "Exporting…" : "Export"}
          </Button>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-md border p-4">
          <div>
            <h3 className="text-sm font-medium">Import</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Restore data from a JSON backup. Choose to overwrite this household or create a new
              one.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={validateMutation.isPending || importMutation.isPending}
          >
            <Upload className="h-3.5 w-3.5 mr-2" />
            Import…
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <ImportDestinationDialog
        isOpen={showDestination}
        onClose={() => {
          setShowDestination(false);
          setPendingImportData(null);
        }}
        onConfirm={handleConfirmImport}
        isPending={importMutation.isPending}
      />
    </Section>
  );
}
