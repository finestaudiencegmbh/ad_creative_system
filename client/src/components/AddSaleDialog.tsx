import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AddSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "campaign" | "adset" | "ad";
  entityName: string;
}

export function AddSaleDialog({ open, onOpenChange, entityId, entityType, entityName }: AddSaleDialogProps) {
  const [orderValue, setOrderValue] = useState("");
  const [cashCollect, setCashCollect] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const createSale = trpc.sales.create.useMutation({
    onSuccess: () => {
      toast.success("Verkauf erfolgreich hinzugefügt");
      // Invalidate relevant queries
      if (entityType === "campaign") {
        utils.campaigns.list.invalidate();
      } else if (entityType === "adset") {
        utils.adsets.listByCampaign.invalidate();
      } else {
        utils.ads.listByAdSet.invalidate();
      }
      // Reset form
      setOrderValue("");
      setCashCollect("");
      setCompletionDate("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderValue || !cashCollect || !completionDate) {
      toast.error("Bitte alle Pflichtfelder ausfüllen");
      return;
    }

    const saleData: any = {
      orderValue: parseFloat(orderValue),
      cashCollect: parseFloat(cashCollect),
      completionDate: new Date(completionDate),
      notes: notes || undefined,
    };

    // Set the appropriate entity ID
    if (entityType === "campaign") {
      saleData.metaCampaignId = entityId;
    } else if (entityType === "adset") {
      saleData.metaAdSetId = entityId;
    } else {
      saleData.metaAdId = entityId;
    }

    createSale.mutate(saleData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Verkauf hinzufügen</DialogTitle>
          <DialogDescription>
            Fügen Sie einen Verkauf zu <strong>{entityName}</strong> hinzu
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="orderValue">Generierter Auftragswert (€) *</Label>
              <Input
                id="orderValue"
                type="number"
                step="0.01"
                value={orderValue}
                onChange={(e) => setOrderValue(e.target.value)}
                placeholder="z.B. 5000.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cashCollect">Cash Collect (€) *</Label>
              <Input
                id="cashCollect"
                type="number"
                step="0.01"
                value={cashCollect}
                onChange={(e) => setCashCollect(e.target.value)}
                placeholder="z.B. 2500.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="completionDate">Datum Abschluss *</Label>
              <Input
                id="completionDate"
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Zusätzliche Informationen..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createSale.isPending}>
              {createSale.isPending ? "Speichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
