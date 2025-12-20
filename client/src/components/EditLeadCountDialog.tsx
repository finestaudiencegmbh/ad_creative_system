import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditLeadCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "campaign" | "adset" | "ad";
  entityName: string;
  currentLeadCount: number;
  leadsFromMeta: number;
}

export function EditLeadCountDialog({
  open,
  onOpenChange,
  entityId,
  entityType,
  entityName,
  currentLeadCount,
  leadsFromMeta,
}: EditLeadCountDialogProps) {
  const [leadCount, setLeadCount] = useState(currentLeadCount.toString());
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();

  // Build query params based on entity type
  const queryParams: any = {};
  if (entityType === "campaign") {
    queryParams.metaCampaignId = entityId;
  } else if (entityType === "adset") {
    queryParams.metaAdSetId = entityId;
  } else {
    queryParams.metaAdId = entityId;
  }

  // Fetch existing correction
  const { data: existingCorrection } = trpc.leadCorrections.getByEntity.useQuery(queryParams, {
    enabled: open,
  });

  useEffect(() => {
    if (existingCorrection) {
      setLeadCount(existingCorrection.correctedLeadCount.toString());
      setNotes(existingCorrection.notes || "");
    } else {
      setLeadCount(currentLeadCount.toString());
      setNotes("");
    }
  }, [existingCorrection, currentLeadCount, open]);

  const upsertCorrection = trpc.leadCorrections.upsert.useMutation({
    onSuccess: () => {
      toast.success("Lead-Anzahl erfolgreich aktualisiert");
      // Invalidate relevant queries
      if (entityType === "campaign") {
        utils.campaigns.list.invalidate();
      } else if (entityType === "adset") {
        utils.adsets.listByCampaign.invalidate();
      } else {
        utils.ads.listByAdSet.invalidate();
      }
      utils.leadCorrections.getByEntity.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteCorrection = trpc.leadCorrections.delete.useMutation({
    onSuccess: () => {
      toast.success("Lead-Korrektur zurückgesetzt");
      // Invalidate relevant queries
      if (entityType === "campaign") {
        utils.campaigns.list.invalidate();
      } else if (entityType === "adset") {
        utils.adsets.listByCampaign.invalidate();
      } else {
        utils.ads.listByAdSet.invalidate();
      }
      utils.leadCorrections.getByEntity.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSave = () => {
    const correctedCount = parseInt(leadCount);
    if (isNaN(correctedCount) || correctedCount < 0) {
      toast.error("Bitte eine gültige Lead-Anzahl eingeben (≥ 0)");
      return;
    }

    upsertCorrection.mutate({
      ...queryParams,
      correctedLeadCount: correctedCount,
      notes: notes || undefined,
    });
  };

  const handleReset = () => {
    if (!existingCorrection) {
      toast.error("Keine Korrektur vorhanden");
      return;
    }

    if (confirm("Möchten Sie die Lead-Korrektur wirklich zurücksetzen? Die Zahl aus dem Meta Ads Manager wird dann wieder verwendet.")) {
      deleteCorrection.mutate({ id: existingCorrection.id });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lead-Anzahl bearbeiten</DialogTitle>
          <DialogDescription>
            Korrigiere die Lead-Anzahl für <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="text-muted-foreground">Meta Ads Manager Wert:</p>
            <p className="text-lg font-semibold">{leadsFromMeta} Leads</p>
          </div>

          <div>
            <Label htmlFor="leadCount">Korrigierte Lead-Anzahl</Label>
            <Input
              id="leadCount"
              type="number"
              min="0"
              value={leadCount}
              onChange={(e) => setLeadCount(e.target.value)}
              placeholder="Anzahl der Leads"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Diese Zahl wird für die Berechnung von CPL und CVR verwendet
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Grund für die Korrektur..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {existingCorrection && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={deleteCorrection.isPending}
            >
              Zurücksetzen
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={upsertCorrection.isPending}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={upsertCorrection.isPending}
          >
            {upsertCorrection.isPending ? "Speichert..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
